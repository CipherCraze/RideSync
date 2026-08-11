from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review_service import ReviewService
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(db)
    return await service.create_review(current_user.id, review_in)

@router.get("/vehicle/{vehicle_id}", response_model=List[ReviewResponse])
async def get_vehicle_reviews(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    service = ReviewService(db)
    return await service.get_by_vehicle(vehicle_id)

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(user_id: int, db: AsyncSession = Depends(get_db)):
    service = ReviewService(db)
    return await service.get_by_user(user_id)
