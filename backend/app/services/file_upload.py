import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from backend.core.config import MEDIA_ROOT, MAX_AVATAR_SIZE, ALLOWED_IMAGE_EXTENSIONS


def validate_image(file: UploadFile):
    """
    Yuklangan faylning kengaytmasi va hajmini tekshiradi.
    """
    # Kengaytmani tekshirish
    ext = file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ruxsat etilmagan fayl turi. Ruxsat etilganlar: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Hajmni tekshirish
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Fayl juda katta. Maksimal hajm: {MAX_AVATAR_SIZE // (1024 * 1024)} MB"
        )
    return ext


def save_file(file: UploadFile, subdir: str) -> str:
    """
    Yuklangan faylni media papkasiga saqlaydi va URL manzilini qaytaradi.
    """
    ext = validate_image(file)
    filename = f"{uuid.uuid4()}.{ext}"
    relative_path = os.path.join(subdir, filename)
    full_path = os.path.join(MEDIA_ROOT, relative_path)
    
    # Papkalarni yaratish
    Path(os.path.dirname(full_path)).mkdir(parents=True, exist_ok=True)
    
    # Faylni yozish
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return f"/media/{relative_path}"


def delete_file(url: str):
    """
    Berilgan URL manzildagi faylni o'chiradi.
    """
    if not url or not url.startswith("/media/"):
        return
    file_path = os.path.join(MEDIA_ROOT, url[len("/media/"):])
    if os.path.exists(file_path):
        os.remove(file_path)