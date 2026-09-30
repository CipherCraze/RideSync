import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILES = 10
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024 # 50 MB

@router.post("/", response_model=List[str])
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Cannot upload more than {MAX_FILES} files at once.")

    uploaded_urls = []
    
    for file in files:
        if not file.content_type.startswith("image/") and not file.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="Only image and video files are allowed.")
            
        if file.content_type.startswith("image/") and file.size > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail=f"Image {file.filename} exceeds the 5MB size limit.")
            
        if file.content_type.startswith("video/") and file.size > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail=f"Video {file.filename} exceeds the 50MB size limit.")
            
        file_extension = os.path.splitext(file.filename)[1]
        new_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Assuming the backend serves the 'uploads' directory statically at /uploads
        file_url = f"http://localhost:8000/uploads/{new_filename}"
        uploaded_urls.append(file_url)
        
    return uploaded_urls
