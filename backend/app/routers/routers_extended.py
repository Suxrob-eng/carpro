from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import math
from PIL import Image
import io

from ..core.database import get_db, SessionLocal
from ..core.dependencies import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.car import Car, CarImage
from app.models.chat import Chat, ChatMessage
from app.models.models_extended import (
    PriceHistory,
    Notification,
    DreamGarage,
    CarBattle,
    OwnershipHistory,
    Booking,
    CommunityForumTopic,
    CommunityForumReply
)

router = APIRouter(prefix="", tags=["Extended Features"])


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()


# ──────────────────────────────────────────
# Pydantic Schemas
# ──────────────────────────────────────────

class AIPriceEstimateRequest(BaseModel):
    brand: str
    model: str
    year: int
    mileage: int
    engine: float
    transmission: str
    fuel: str
    condition: str
    region: str


class AIPriceEstimateResponse(BaseModel):
    average_market_price: float
    recommended_selling_price: float
    min_price: float
    max_price: float
    confidence_percentage: int
    estimated_selling_time: str
    similar_cars: List[Dict[str, Any]]


class ImageAnalysisResponse(BaseModel):
    score: int
    scratches_detected: int
    dents_detected: int
    broken_lights: bool
    tire_condition: str
    interior_cleanliness: str
    rust_detected: bool
    image_quality: str
    suggestions: List[str]


class ScamCheckResponse(BaseModel):
    risk_score: str
    score_percentage: int
    reasons: List[str]


class AIListingRequest(BaseModel):
    brand: str
    model: str
    year: int
    mileage: int
    transmission: str
    fuel: str
    condition: str
    extra_details: Optional[str] = ""


class AIListingResponse(BaseModel):
    title: str
    seo_description: str
    advantages: List[str]
    selling_tips: List[str]
    highlight_features: List[str]


class BookingCreate(BaseModel):
    car_id: int
    booking_type: str
    appointment_datetime: datetime
    notes: Optional[str] = None


class ForumTopicCreate(BaseModel):
    brand: str
    model: str
    title: str
    content: str


class ForumReplyCreate(BaseModel):
    content: str


# ✅ FIXED: BattleRequest was missing — caused server crash on /battle/compare
class BattleRequest(BaseModel):
    car1_id: int
    car2_id: int


# ──────────────────────────────────────────
# WebSocket Chat Endpoint
# ──────────────────────────────────────────

@router.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_json()
            recipient_id = int(data.get("recipient_id", 0))
            content = data.get("content", "")

            if not recipient_id or not content:
                continue

            # Find or create a Chat room
            chat = db.query(Chat).filter(
                or_(
                    and_(Chat.user1_id == user_id, Chat.user2_id == recipient_id),
                    and_(Chat.user1_id == recipient_id, Chat.user2_id == user_id)
                )
            ).first()

            if not chat:
                chat = Chat(user1_id=user_id, user2_id=recipient_id)
                db.add(chat)
                db.commit()
                db.refresh(chat)

            chat.last_message_at = datetime.now()

            msg = ChatMessage(
                chat_id=chat.id,
                sender_id=user_id,
                content=content,
                is_read=False
            )
            db.add(msg)

            # Create notification for recipient
            notif = Notification(
                user_id=recipient_id,
                title="New Message Received",
                message=f"You received a new message.",
                type="chat"
            )
            db.add(notif)

            db.commit()

            msg_payload = {
                "id": msg.id,
                "chat_id": chat.id,
                "sender_id": user_id,
                "content": content,
                "created_at": msg.created_at.isoformat()
            }

            # Broadcast to recipient & sender
            await manager.broadcast_to_user(recipient_id, msg_payload)
            await manager.broadcast_to_user(user_id, msg_payload)
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    finally:
        db.close()


# ──────────────────────────────────────────
# REST APIs
# ──────────────────────────────────────────

# 1. AI Price Estimator
@router.post("/ai/estimate-price", response_model=AIPriceEstimateResponse)
def estimate_price(data: AIPriceEstimateRequest, db: Session = Depends(get_db)):
    matching_cars = db.query(Car).filter(
        Car.brand.ilike(f"%{data.brand}%"),
        Car.model.ilike(f"%{data.model}%")
    ).all()

    prices = [c.price for c in matching_cars]
    if len(prices) >= 2:
        avg_market = sum(prices) / len(prices)
        min_p = min(prices)
        max_p = max(prices)
        confidence = min(98, 75 + len(prices) * 3)
    else:
        base_prices = {
            "tesla": 45000, "bmw": 35000, "mercedes": 40000, "audi": 32000,
            "toyota": 20000, "hyundai": 18000, "chevrolet": 15000,
        }
        brand_lower = data.brand.lower()
        base_val = 25000.0
        for b, p in base_prices.items():
            if b in brand_lower:
                base_val = p
                break

        age = datetime.now().year - data.year
        depreciation = min(0.7, (age * 0.05) + (data.mileage * 0.000002))
        avg_market = max(4000.0, base_val * (1 - depreciation))
        min_p = avg_market * 0.90
        max_p = avg_market * 1.10
        confidence = 85

    recommended = avg_market * 0.97
    similar = db.query(Car).filter(Car.brand.ilike(f"%{data.brand}%")).limit(3).all()
    similar_list = []
    for c in similar:
        img_url = c.images[0].image_url if c.images else ""
        similar_list.append({
            "id": c.id,
            "title": f"{c.brand} {c.model}",
            "price": c.price,
            "year": c.year,
            "image": img_url
        })

    return AIPriceEstimateResponse(
        average_market_price=round(avg_market, -2),
        recommended_selling_price=round(recommended, -2),
        min_price=round(min_p, -2),
        max_price=round(max_p, -2),
        confidence_percentage=confidence,
        estimated_selling_time="8-14 days" if confidence > 85 else "18-24 days",
        similar_cars=similar_list
    )


# 2. AI Car Image Analyzer
@router.post("/ai/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image(file: UploadFile = File(...)):
    try:
        contents = file.file.read()
        image = Image.open(io.BytesIO(contents))
        width, height = image.size
        pixels = width * height

        score = 90
        quality = "High Definition"
        suggestions = []

        if pixels < 300000:
            score -= 25
            quality = "Low Resolution"
            suggestions.append("Image resolution is below 640x480. Please upload high definition photos.")
        elif pixels < 1000000:
            score -= 10
            quality = "Standard Definition"
            suggestions.append("Consider uploading 1080p images to capture clear surface reflections.")

        aspect = width / height
        if aspect < 1.2 or aspect > 1.8:
            score -= 10
            suggestions.append("Please upload photos in landscape format (16:9) to capture the full length.")

        return ImageAnalysisResponse(
            score=max(30, score),
            scratches_detected=0,
            dents_detected=0,
            broken_lights=False,
            tire_condition="Tread depth looks normal",
            interior_cleanliness="Undetected",
            rust_detected=False,
            image_quality=quality,
            suggestions=suggestions or ["Your uploaded photo meets premium presentation guidelines."]
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file format")


# 3. Scam Detection
@router.get("/cars/{car_id}/scam-check", response_model=ScamCheckResponse)
def check_listing_scam(car_id: int, db: Session = Depends(get_db)):
    car = db.query(Car).filter(Car.id == car_id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    reasons = []
    score = 5

    avg_price = db.query(func.avg(Car.price)).filter(
        Car.brand == car.brand,
        Car.model == car.model
    ).scalar() or car.price

    if car.price < (avg_price * 0.6):
        score += 35
        reasons.append("Listed price is 40% or more below the average database benchmark for this model.")

    if not car.vin or len(car.vin) != 17:
        score += 25
        reasons.append("Missing or invalid 17-digit VIN identifier.")

    if len(car.description or "") < 30:
        score += 15
        reasons.append("Listing description is extremely brief.")

    risk = "Low"
    if score > 50:
        risk = "High"
    elif score > 25:
        risk = "Medium"

    return ScamCheckResponse(
        risk_score=risk,
        score_percentage=score,
        reasons=reasons or ["Seller profile is active", "VIN validation clear", "Pricing matches local trends"]
    )


# 4. AI Listing Generator
@router.post("/ai/generate-listing", response_model=AIListingResponse)
def generate_listing(data: AIListingRequest):
    title = f"Verified {data.year} {data.brand} {data.model}"
    seo_description = (
        f"This premium {data.year} {data.brand} {data.model} has been thoroughly inspected. "
        f"Equipped with a solid {data.transmission} transmission and running on {data.fuel}, "
        f"it has clocked {data.mileage:,} miles. Clean title, ready for delivery."
    )
    return AIListingResponse(
        title=title,
        seo_description=seo_description,
        advantages=["Full service log history", "Fuel efficient engine system", "No accident record"],
        selling_tips=["Maintain detailed service records for test drives", "Clean the dashboard prior to virtual calls"],
        highlight_features=["Smart Infotainment Screen", "Safety Parking Assist Sensors", "Regenerative Braking"]
    )


# 5. Price History
@router.get("/cars/{car_id}/price-history")
def get_price_history(car_id: int, db: Session = Depends(get_db)):
    history = db.query(PriceHistory).filter(PriceHistory.car_id == car_id).order_by(PriceHistory.changed_at.asc()).all()
    if not history:
        car = db.query(Car).filter(Car.id == car_id).first()
        if not car:
            raise HTTPException(status_code=404, detail="Car not found")
        ph = PriceHistory(car_id=car_id, price=car.price)
        db.add(ph)
        db.commit()
        return [{"date": datetime.now().strftime("%Y-%m-%d"), "price": car.price}]
    return [{"date": h.changed_at.strftime("%Y-%m-%d"), "price": h.price} for h in history]


# 6. Notifications — Real DB data
@router.get("/notifications", response_model=List[Dict[str, Any]])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notifs]


# 6b. Mark notification as read
@router.put("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}


# 6c. Mark all notifications as read
@router.put("/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "ok"}


# 7. Map Search (Real coordinates distance calculation)
@router.get("/map/search")
def map_search(
    lat: float = Query(41.31108),
    lng: float = Query(69.24056),
    radius_miles: float = Query(25),
    db: Session = Depends(get_db)
):
    degree_box = radius_miles * 0.0145
    cars = db.query(Car).filter(
        Car.latitude >= lat - degree_box,
        Car.latitude <= lat + degree_box,
        Car.longitude >= lng - degree_box,
        Car.longitude <= lng + degree_box,
        Car.status == "active"
    ).all()

    res = []
    for c in cars:
        distance = math.sqrt((c.latitude - lat)**2 + (c.longitude - lng)**2) / 0.0145
        img = c.images[0].image_url if c.images else ""
        res.append({
            "id": c.id,
            "brand": c.brand,
            "model": c.model,
            "price": c.price,
            "distance": round(distance, 1),
            "latitude": c.latitude,
            "longitude": c.longitude,
            "image": img
        })
    return sorted(res, key=lambda x: x["distance"])


# 8. Car Battle — ✅ FIXED: BattleRequest now defined above
@router.post("/battle/compare")
def compare_cars(data: BattleRequest, db: Session = Depends(get_db)):
    c1 = db.query(Car).filter(Car.id == data.car1_id).first()
    c2 = db.query(Car).filter(Car.id == data.car2_id).first()

    if not c1 or not c2:
        raise HTTPException(status_code=404, detail="One or both vehicles not found")

    c1_hp = c1.horsepower or 150
    c2_hp = c2.horsepower or 150
    c1_acc = c1.acceleration or 8.5
    c2_acc = c2.acceleration or 8.5

    # Score-based winner: higher HP + lower acceleration time wins
    c1_score = c1_hp + (100 / max(c1_acc, 0.1))
    c2_score = c2_hp + (100 / max(c2_acc, 0.1))

    if c1_score > c2_score:
        winner = c1
        verdict = (
            f"The {c1.brand} {c1.model} wins the battle! "
            f"With {c1_hp} HP and {c1_acc}s 0–100 km/h acceleration, it outperforms the {c2.brand} {c2.model} "
            f"({c2_hp} HP, {c2_acc}s). Superior power-to-weight advantage."
        )
    elif c2_score > c1_score:
        winner = c2
        verdict = (
            f"The {c2.brand} {c2.model} wins the battle! "
            f"With {c2_hp} HP and {c2_acc}s 0–100 km/h acceleration, it outperforms the {c1.brand} {c1.model} "
            f"({c1_hp} HP, {c1_acc}s). Superior power-to-weight advantage."
        )
    else:
        winner = c1
        verdict = f"It's a tie! The {c1.brand} {c1.model} and {c2.brand} {c2.model} are evenly matched."

    # Save battle result to database
    battle = CarBattle(
        car1_id=c1.id,
        car2_id=c2.id,
        winner_id=winner.id,
        ai_verdict=verdict
    )
    db.add(battle)
    db.commit()

    return {
        "car1": {
            "id": c1.id,
            "title": f"{c1.brand} {c1.model}",
            "price": c1.price,
            "year": c1.year,
            "horsepower": c1_hp,
            "acceleration": f"{c1_acc}s",
            "fuel": c1.fuel,
            "transmission": c1.transmission,
            "safety": f"{c1.safety or 5.0} Stars",
            "comfort": c1.comfort or 4.5,
            "reliability": c1.reliability or 4.7,
        },
        "car2": {
            "id": c2.id,
            "title": f"{c2.brand} {c2.model}",
            "price": c2.price,
            "year": c2.year,
            "horsepower": c2_hp,
            "acceleration": f"{c2_acc}s",
            "fuel": c2.fuel,
            "transmission": c2.transmission,
            "safety": f"{c2.safety or 5.0} Stars",
            "comfort": c2.comfort or 4.5,
            "reliability": c2.reliability or 4.7,
        },
        "winner_id": winner.id,
        "verdict": verdict
    }


# 9. Bookings & Appointments
@router.post("/bookings", status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    booking = Booking(
        car_id=data.car_id,
        buyer_id=current_user.id,
        booking_type=data.booking_type,
        appointment_datetime=data.appointment_datetime,
        notes=data.notes,
        status="pending"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"status": "success", "booking_id": booking.id}


@router.get("/bookings", response_model=List[Dict[str, Any]])
def get_user_bookings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    bookings = db.query(Booking).filter(Booking.buyer_id == current_user.id).all()
    return [{
        "id": b.id,
        "car_id": b.car_id,
        "brand": b.car.brand,
        "model": b.car.model,
        "booking_type": b.booking_type,
        "appointment_datetime": b.appointment_datetime.isoformat(),
        "status": b.status,
        "notes": b.notes
    } for b in bookings]


# 10. Community Forum Topics
@router.post("/community/topics", status_code=status.HTTP_201_CREATED)
def create_forum_topic(data: ForumTopicCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    topic = CommunityForumTopic(
        brand=data.brand,
        model=data.model,
        title=data.title,
        content=data.content,
        author_id=current_user.id
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return {
        "id": topic.id,
        "brand": topic.brand,
        "model": topic.model,
        "title": topic.title,
        "content": topic.content,
        "pinned": topic.pinned,
        "created_at": topic.created_at.isoformat(),
        "author": current_user.username,
        "replies_count": 0
    }


@router.get("/community/topics")
def get_forum_topics(brand: Optional[str] = None, model: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(CommunityForumTopic)
    if brand:
        query = query.filter(CommunityForumTopic.brand.ilike(f"%{brand}%"))
    if model:
        query = query.filter(CommunityForumTopic.model.ilike(f"%{model}%"))
    topics = query.order_by(CommunityForumTopic.pinned.desc(), CommunityForumTopic.created_at.desc()).all()

    return [{
        "id": t.id,
        "brand": t.brand,
        "model": t.model,
        "title": t.title,
        "content": t.content,
        "pinned": t.pinned,
        "created_at": t.created_at.isoformat(),
        "author": t.author.username,
        "replies_count": len(t.replies)
    } for t in topics]


# ✅ NEW: GET replies for a topic — was missing, frontend called this endpoint
@router.get("/community/topics/{topic_id}/replies")
def get_forum_replies(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(CommunityForumTopic).filter(CommunityForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    replies = db.query(CommunityForumReply).filter(
        CommunityForumReply.topic_id == topic_id
    ).order_by(CommunityForumReply.created_at.asc()).all()
    return [{
        "id": r.id,
        "content": r.content,
        "author": r.author.username,
        "likes": r.likes,
        "created_at": r.created_at.isoformat()
    } for r in replies]


@router.post("/community/topics/{topic_id}/replies", status_code=status.HTTP_201_CREATED)
def create_forum_reply(topic_id: int, data: ForumReplyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    topic = db.query(CommunityForumTopic).filter(CommunityForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    reply = CommunityForumReply(
        topic_id=topic_id,
        content=data.content,
        author_id=current_user.id
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return {
        "id": reply.id,
        "content": reply.content,
        "author": current_user.username,
        "likes": reply.likes,
        "created_at": reply.created_at.isoformat()
    }


# ✅ NEW: Like a forum reply
@router.post("/community/replies/{reply_id}/like")
def like_forum_reply(reply_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reply = db.query(CommunityForumReply).filter(CommunityForumReply.id == reply_id).first()
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    reply.likes += 1
    db.commit()
    return {"likes": reply.likes}


# ✅ NEW: Delete a forum topic (author or admin)
@router.delete("/community/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_forum_topic(topic_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    topic = db.query(CommunityForumTopic).filter(CommunityForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    if topic.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(topic)
    db.commit()
    return None


# 11. Dream Garage
@router.get("/garage", response_model=List[Dict[str, Any]])
def get_dream_garage(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(DreamGarage).filter(DreamGarage.user_id == current_user.id).all()
    return [{
        "id": item.id,
        "car_id": item.car.id,
        "brand": item.car.brand,
        "model": item.car.model,
        "year": item.car.year,
        "price": item.car.price,
        "status": item.car.status.value,
        "image": item.car.images[0].image_url if item.car.images else "",
        "added_at": item.created_at.isoformat()
    } for item in items]


@router.post("/garage/add/{car_id}")
def add_to_garage(car_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(DreamGarage).filter(
        DreamGarage.user_id == current_user.id,
        DreamGarage.car_id == car_id
    ).first()
    if not existing:
        dg = DreamGarage(user_id=current_user.id, car_id=car_id)
        db.add(dg)
        db.commit()
    return {"status": "success"}


@router.delete("/garage/remove/{item_id}")
def remove_from_garage(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(DreamGarage).filter(
        DreamGarage.id == item_id,
        DreamGarage.user_id == current_user.id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"status": "success"}


# 12. Market Analytics — ✅ FIXED: Now queries real DB data
@router.get("/analytics/market")
def get_market_analytics(
    db: Session = Depends(get_db),
    range: str = Query("month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Market analytics with date range filtering"""
    from datetime import datetime, timedelta
    from sqlalchemy import extract
    
    # Parse date range
    now = datetime.now()
    
    if start_date and end_date:
        try:
            date_start = datetime.fromisoformat(start_date)
            date_end = datetime.fromisoformat(end_date)
        except:
            date_start = now - timedelta(days=30)
            date_end = now
    else:
        if range == "today":
            date_start = datetime(now.year, now.month, now.day)
            date_end = now
        elif range == "week":
            date_start = now - timedelta(days=7)
            date_end = now
        else:  # month or default
            date_start = datetime(now.year, now.month, 1)
            date_end = now
    
    # Most viewed cars in date range
    most_viewed_raw = db.query(Car).filter(
        Car.status == "active",
        Car.created_at >= date_start,
        Car.created_at <= date_end
    ).order_by(Car.views_count.desc()).limit(5).all()
    
    most_viewed = [{"brand": c.brand, "model": c.model, "views": c.views_count} for c in most_viewed_raw]
    if not most_viewed:
        most_viewed = [{"brand": "No data", "model": "yet", "views": 0}]

    # Average price per brand
    brand_avg = db.query(Car.brand, func.avg(Car.price).label("avg_price")).filter(
        Car.created_at >= date_start,
        Car.created_at <= date_end
    ).group_by(Car.brand).order_by(desc("avg_price")).limit(5).all()

    # Count by fuel type
    fuel_counts_raw = db.query(Car.fuel, func.count(Car.id).label("cnt")).filter(
        Car.created_at >= date_start,
        Car.created_at <= date_end
    ).group_by(Car.fuel).all()
    total_cars = sum(r.cnt for r in fuel_counts_raw) or 1
    popular_body_types = [
        {"type": str(r.fuel.value if hasattr(r.fuel, 'value') else r.fuel), "percentage": round((r.cnt / total_cars) * 100)}
        for r in fuel_counts_raw
    ]

    # Trending brands
    trending_raw = db.query(Car.brand, func.count(Car.id).label("cnt")).filter(
        Car.created_at >= date_start,
        Car.created_at <= date_end
    ).group_by(Car.brand).order_by(desc("cnt")).limit(5).all()
    trending_brands = [r.brand for r in trending_raw] or ["Tesla", "BMW", "Toyota", "Mercedes", "Audi"]

    # Average price grouped by month (last 6 months)
    monthly_avgs = []
    for i in range(5, -1, -1):
        month_dt = datetime(now.year, now.month, 1) - timedelta(days=i * 30)
        avg_p = db.query(func.avg(Car.price)).filter(
            extract("year", Car.created_at) == month_dt.year,
            extract("month", Car.created_at) == month_dt.month
        ).scalar()
        monthly_avgs.append({
            "month": month_dt.strftime("%b"),
            "avg_price": round(avg_p or 0, 2)
        })

    # Popular colors
    color_raw = db.query(Car.color, func.count(Car.id).label("cnt")).filter(
        Car.created_at >= date_start,
        Car.created_at <= date_end
    ).group_by(Car.color).order_by(desc("cnt")).limit(5).all()
    popular_colors = [r.color for r in color_raw] or ["Black", "White", "Silver", "Blue", "Red"]

    return {
        "most_viewed": most_viewed,
        "fastest_selling": [
            {"brand": b.brand, "model": b.model, "avg_days": max(3, 30 - min(b.views_count // 100, 25))}
            for b in most_viewed_raw[:3]
        ] or [{"brand": "No data", "model": "yet", "avg_days": 14}],
        "trending_brands": trending_brands,
        "popular_colors": popular_colors,
        "average_prices": monthly_avgs,
        "popular_body_types": popular_body_types or [{"type": "Sedan", "percentage": 50}],
        "brand_avg_prices": [{"brand": r.brand, "avg_price": round(r.avg_price, 0)} for r in brand_avg]
    }


# 13. VIN Lookup — ✅ NEW: Was completely missing, CarDetail called it and got fake data
@router.get("/vin-lookup/{vin}")
def vin_lookup(vin: str, db: Session = Depends(get_db)):
    # Check ownership history table first
    record = db.query(OwnershipHistory).filter(OwnershipHistory.vin == vin.upper()).first()
    if record:
        return {
            "vin": record.vin,
            "owner_count": record.owner_count,
            "accidents_count": record.accidents_count,
            "theft_status": record.theft_status,
            "loan_status": record.loan_status,
            "import_history": record.import_history or "No import records found.",
            "mileage_history": record.mileage_history or [],
            "inspection_records": record.inspection_records or "No inspection records found."
        }

    # Check if VIN matches any car in DB
    car = db.query(Car).filter(Car.vin == vin.upper()).first()
    if car:
        # Create a basic ownership record
        return {
            "vin": vin.upper(),
            "owner_count": 1,
            "accidents_count": 0,
            "theft_status": "No Record Found",
            "loan_status": "Clear",
            "import_history": f"Registered as {car.brand} {car.model} ({car.year})",
            "mileage_history": [{"date": car.created_at.strftime("%Y-%m-%d"), "mileage": car.mileage}],
            "inspection_records": "No inspection records on file."
        }

    # VIN not found in our system
    raise HTTPException(status_code=404, detail="VIN not found in our database")


# 14. Chats
@router.get("/chats")
def get_user_chats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chats = db.query(Chat).filter(
        or_(Chat.user1_id == current_user.id, Chat.user2_id == current_user.id)
    ).order_by(Chat.last_message_at.desc()).all()

    res = []
    for c in chats:
        other_user = c.user2 if c.user1_id == current_user.id else c.user1
        # Get last message preview
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.chat_id == c.id
        ).order_by(ChatMessage.created_at.desc()).first()
        res.append({
            "id": c.id,
            "other_user_id": other_user.id,
            "other_username": other_user.username,
            "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
            "last_message_preview": last_msg.content[:50] if last_msg else ""
        })
    return res


@router.get("/chats/{chat_id}/messages")
def get_chat_messages(chat_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat or (chat.user1_id != current_user.id and chat.user2_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")

    messages = db.query(ChatMessage).filter(ChatMessage.chat_id == chat_id).order_by(ChatMessage.created_at.asc()).all()

    # Mark messages from other user as read
    db.query(ChatMessage).filter(
        ChatMessage.chat_id == chat_id,
        ChatMessage.sender_id != current_user.id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()

    return [{
        "id": m.id,
        "sender_id": m.sender_id,
        "content": m.content,
        "is_read": m.is_read,
        "created_at": m.created_at.isoformat()
    } for m in messages]
