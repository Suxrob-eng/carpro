import re
from typing import Optional


def validate_phone_number(phone: str) -> bool:
    """Validate phone number format"""
    cleaned = re.sub(r"[^0-9+]", "", phone)
    return len(cleaned) >= 7


def validate_email(email: Optional[str]) -> bool:
    """Basic email validation"""
    if not email:
        return True
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_image_file(filename: str) -> bool:
    """Validate image file extension"""
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    ext = os.path.splitext(filename)[1].lower()
    return ext in allowed_extensions