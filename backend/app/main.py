from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
from datetime import datetime

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import *  # noqa
from app.models.enums import CarFuel, CarTransmission, CarStatus, UserRole

# Automatically create all tables if they do not exist
Base.metadata.create_all(bind=engine)


def seed_demo_data() -> None:
    db: Session = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == 'admin').first()
        if not admin_user:
            admin_user = User(
                username='admin',
                email='admin@carpro.local',
                phone_number='998900000001',
                full_name='Admin User',
                hashed_password=get_password_hash('admin123'),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        demo_owner = db.query(User).filter(User.username == 'demo_owner').first()
        if not demo_owner:
            demo_owner = User(
                username='demo_owner',
                email='demo@carpro.local',
                phone_number='998900000002',
                full_name='Demo Owner',
                hashed_password=get_password_hash('demo12345'),
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
            )
            db.add(demo_owner)
            db.commit()
            db.refresh(demo_owner)

        owner = admin_user or demo_owner

        car_count = db.query(Car).count()
        if car_count == 0:
            demo_cars = [
            {
                'brand': 'Tesla', 'model': 'Model 3', 'year': 2024, 'price': 38900, 'mileage': 12000,
                'fuel': CarFuel.ELEKTR, 'transmission': CarTransmission.AVTOMAT, 'color': 'White',
                'description': 'Premium electric sedan with long-range performance.', 'status': CarStatus.ACTIVE,
                'views_count': 1250, 'average_rating': 4.8, 'is_featured': True,
                'horsepower': 283, 'acceleration': 5.8, 'safety': 5.0, 'comfort': 4.8, 'reliability': 4.7,
                'latitude': 41.31108, 'longitude': 69.24056, 'owner_id': owner.id,
            },
            {
                'brand': 'BMW', 'model': '330i', 'year': 2023, 'price': 44100, 'mileage': 18000,
                'fuel': CarFuel.BENZIN, 'transmission': CarTransmission.AVTOMAT, 'color': 'Black',
                'description': 'Sport luxury compact sedan with strong daily performance.', 'status': CarStatus.ACTIVE,
                'views_count': 980, 'average_rating': 4.6, 'is_featured': True,
                'horsepower': 255, 'acceleration': 5.6, 'safety': 4.8, 'comfort': 4.6, 'reliability': 4.7,
                'latitude': 41.32108, 'longitude': 69.26056, 'owner_id': owner.id,
            },
            {
                'brand': 'Toyota', 'model': 'Camry Hybrid', 'year': 2024, 'price': 28700, 'mileage': 14000,
                'fuel': CarFuel.GIBRID, 'transmission': CarTransmission.AVTOMAT, 'color': 'Silver',
                'description': 'Reliable hybrid family sedan with excellent efficiency.', 'status': CarStatus.ACTIVE,
                'views_count': 840, 'average_rating': 4.7, 'is_featured': False,
                'horsepower': 208, 'acceleration': 6.7, 'safety': 4.9, 'comfort': 4.5, 'reliability': 4.9,
                'latitude': 41.29908, 'longitude': 69.22056, 'owner_id': owner.id,
            },
            {
                'brand': 'Porsche', 'model': 'Taycan', 'year': 2022, 'price': 92800, 'mileage': 9000,
                'fuel': CarFuel.ELEKTR, 'transmission': CarTransmission.ROBOT, 'color': 'Blue',
                'description': 'Fast electric sports car with premium design and acceleration.', 'status': CarStatus.ACTIVE,
                'views_count': 1480, 'average_rating': 4.9, 'is_featured': True,
                'horsepower': 469, 'acceleration': 3.7, 'safety': 4.8, 'comfort': 4.6, 'reliability': 4.6,
                'latitude': 41.33408, 'longitude': 69.24756, 'owner_id': owner.id,
            },
            {
                'brand': 'Mercedes', 'model': 'E-Class', 'year': 2021, 'price': 56200, 'mileage': 26000,
                'fuel': CarFuel.DIZEL, 'transmission': CarTransmission.AVTOMAT, 'color': 'Graphite',
                'description': 'Executive sedan with comfort-focused luxury and long-range reliability.', 'status': CarStatus.ACTIVE,
                'views_count': 690, 'average_rating': 4.5, 'is_featured': False,
                'horsepower': 245, 'acceleration': 6.4, 'safety': 4.7, 'comfort': 4.9, 'reliability': 4.6,
                'latitude': 41.34108, 'longitude': 69.27956, 'owner_id': owner.id,
            },
        ]

            for item in demo_cars:
                car = Car(**item)
                db.add(car)
                db.flush()
                db.add(CarImage(
                    car_id=car.id,
                    image_url='https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800',
                    is_primary=True,
                    order=0,
                ))

        if db.query(CommunityForumTopic).count() == 0:
            db.add_all([
                CommunityForumTopic(
                    brand='Tesla', model='Model 3', title='Tesla Model 3 ownership review',
                    content='What has your real-world battery range been like in winter?',
                    author_id=owner.id, pinned=True
                ),
                CommunityForumTopic(
                    brand='BMW', model='330i', title='BMW 330i tuning and maintenance tips',
                    content='How do you keep the long-term ownership cost under control?',
                    author_id=owner.id, pinned=False
                ),
            ])

        if db.query(DreamGarage).filter(DreamGarage.user_id == owner.id).count() == 0:
            first_car = db.query(Car).order_by(Car.id.asc()).first()
            if first_car:
                db.add(DreamGarage(user_id=owner.id, car_id=first_car.id))

        db.commit()
    finally:
        db.close()


seed_demo_data()

from app.routers import (
    auth_router,
    user_router,
    car_router,
    category_router,
    favorites_router,
    admin_router,
    extended_router,
)

app = FastAPI(
    title="CarPro API",
    description="Car marketplace backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static / media files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

media_dir = os.path.join(os.path.dirname(__file__), "media")
os.makedirs(media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=media_dir), name="media")

# Routers
app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(car_router, prefix="/api")
app.include_router(category_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(extended_router, prefix="/api")


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "CarPro API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
