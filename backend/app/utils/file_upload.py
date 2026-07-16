import os
import uuid
import shutil
from typing import List
from fastapi import UploadFile, HTTPException, status
from PIL import Image
import asyncio

from ..core.config import settings


def validate_image_file(file: UploadFile) -> bool:
    """Validate that the file is a valid image"""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(allowed_types)}",
        )

    # Check file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Max size: 10MB",
        )

    return True


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return os.path.splitext(filename)[1].lower()


def generate_filename(original_filename: str, prefix: str = "") -> str:
    """Generate a unique filename"""
    ext = get_file_extension(original_filename)
    if not ext:
        ext = ".jpg"
    unique_id = uuid.uuid4().hex[:12]
    return f"{prefix}{unique_id}{ext}"


def upload_avatar(file: UploadFile, user_id: int) -> str:
    """Upload an avatar for a user"""
    validate_image_file(file)

    # Create user avatar directory
    avatar_dir = os.path.join(settings.MEDIA_ROOT, "avatars", str(user_id))
    os.makedirs(avatar_dir, exist_ok=True)

    filename = generate_filename(file.filename, f"avatar_")
    file_path = os.path.join(avatar_dir, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Optimize image
    try:
        with Image.open(file_path) as img:
            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            img.save(file_path, quality=85, optimize=True)
    except Exception:
        pass

    return f"{settings.MEDIA_URL}/avatars/{user_id}/{filename}"


def upload_car_images(files: List[UploadFile], car_id: int) -> List[str]:
    """Upload multiple images for a car"""
    if not files:
        return []

    if len(files) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 images per car",
        )

    urls = []
    car_dir = os.path.join(settings.MEDIA_ROOT, "cars", str(car_id))
    os.makedirs(car_dir, exist_ok=True)

    for i, file in enumerate(files):
        validate_image_file(file)

        filename = generate_filename(file.filename, f"car_{i}_")
        file_path = os.path.join(car_dir, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Optimize image
        try:
            with Image.open(file_path) as img:
                # Resize if too large
                if img.width > 1200 or img.height > 1200:
                    img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                img.save(file_path, quality=85, optimize=True)
        except Exception:
            pass

        urls.append(f"{settings.MEDIA_URL}/cars/{car_id}/{filename}")

    return urls


def delete_file(file_path: str) -> bool:
    """Delete a file from the filesystem"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
    except Exception:
        pass
    return False