from sqlalchemy.orm import Session
from models.notification import Notification
from backend.app.schemas.notification import NotificationResponse
from typing import List, Optional


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    message: str
) -> Notification:
    """
    Yangi bildirishnoma yaratadi.
    """
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def get_user_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False
) -> List[Notification]:
    """
    Foydalanuvchining bildirishnomalarini sahifalash bilan qaytaradi.
    """
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    user_id: int
) -> Optional[Notification]:
    """
    Bitta bildirishnomani o'qilgan deb belgilaydi.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif


def mark_all_notifications_read(db: Session, user_id: int) -> int:
    """
    Foydalanuvchining barcha bildirishnomalarini o'qilgan deb belgilaydi.
    Yangilangan yozuvlar sonini qaytaradi.
    """
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return count


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """
    Bildirishnomani o'chiradi. Agar o'chirilgan bo'lsa True, aks holda False.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        db.delete(notif)
        db.commit()
        return True
    return False