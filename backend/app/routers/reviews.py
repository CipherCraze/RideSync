from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewEligibilityResponse
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

@router.get("/booking/{booking_id}/eligibility", response_model=ReviewEligibilityResponse)
async def check_booking_review_eligibility(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(db)
    return await service.check_booking_eligibility(booking_id, current_user.id)

@router.get("/given", response_model=List[ReviewResponse])
async def get_my_given_reviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ReviewService(db)
    return await service.get_reviews_given(current_user.id)

@router.get("/received", response_model=List[ReviewResponse])
async def get_my_received_reviews(
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_id = user_id if user_id is not None else current_user.id
    service = ReviewService(db)
    return await service.get_by_user(target_id)

@router.get("/vehicle/{vehicle_id}", response_model=List[ReviewResponse])
async def get_vehicle_reviews(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    service = ReviewService(db)
    return await service.get_by_vehicle(vehicle_id)

@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(user_id: int, db: AsyncSession = Depends(get_db)):
    service = ReviewService(db)
    return await service.get_by_user(user_id)
