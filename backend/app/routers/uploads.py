import os
import shutil
import uuid
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = "uploads"
DOCUMENTS_DIR = os.path.join(UPLOAD_DIR, "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DOCUMENTS_DIR, exist_ok=True)

MAX_FILES = 10
MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_DOC_SIZE = 10 * 1024 * 1024    # 10 MB

ALLOWED_DOC_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}

class DocumentUploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size: int

@router.post("/", response_model=List[str])
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Cannot upload more than {MAX_FILES} files at once.")

    uploaded_urls = []
    
    for file in files:
        if not file.content_type.startswith("image/") and not file.content_type.startswith("video/") and file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only image, video, and PDF files are allowed.")
            
        if file.content_type.startswith("image/") and file.size and file.size > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail=f"Image {file.filename} exceeds the 5MB size limit.")
            
        if file.content_type.startswith("video/") and file.size and file.size > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail=f"Video {file.filename} exceeds the 50MB size limit.")

        if file.content_type == "application/pdf" and file.size and file.size > MAX_DOC_SIZE:
            raise HTTPException(status_code=400, detail=f"Document {file.filename} exceeds the 10MB size limit.")
            
        file_extension = os.path.splitext(file.filename or "")[1]
        new_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, new_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_url = f"http://localhost:8000/uploads/{new_filename}"
        uploaded_urls.append(file_url)
        
    return uploaded_urls

@router.post("/document", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type ({file.content_type}). Allowed types: PDF, JPEG, PNG, WEBP."
        )

    if file.size and file.size > MAX_DOC_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Document exceeds maximum allowed size of 10MB."
        )

    file_extension = os.path.splitext(file.filename or "")[1]
    if not file_extension:
        file_extension = ".pdf" if file.content_type == "application/pdf" else ".jpg"

    new_filename = f"doc_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(DOCUMENTS_DIR, new_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    actual_size = os.path.getsize(file_path)
    if actual_size > MAX_DOC_SIZE:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Document exceeds maximum allowed size of 10MB.")

    file_url = f"http://localhost:8000/uploads/documents/{new_filename}"

    return DocumentUploadResponse(
        url=file_url,
        filename=file.filename or new_filename,
        content_type=file.content_type,
        size=actual_size,
    )
