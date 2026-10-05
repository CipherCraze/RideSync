from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.user import (
    UserResponse,
    UserProfileResponse,
    UserUpdate,
    UserVerificationRequest,
    UserPublicCard,
    UserPublicDetail
)
from app.schemas.honor import HonorScoreHistoryResponse
from app.services.user_service import UserService
from app.services.honor_service import HonorService
from app.services.user_discovery_service import UserDiscoveryService
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.review_repository import ReviewRepository
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/discover", response_model=List[UserPublicCard])
async def discover_users(
    query: Optional[str] = Query(None, description="Search by name, email, or bio"),
    role: Optional[str] = Query(None, description="Filter by role: OWNER or RENTER"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    User discovery search for discovering hosts and renters across the community.
    """
    service = UserDiscoveryService(db)
    return await service.search_users(query=query, role=role, skip=skip, limit=limit)

@router.get("/{user_id}/public", response_model=UserPublicDetail)
async def get_public_user_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Public profile projection showing avatar, join date, reputation score, and listed vehicles.
    """
    service = UserDiscoveryService(db)
    return await service.get_user_public_profile(user_id)

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)

    vehicle_repo = VehicleRepository(db)
    booking_repo = BookingRepository(db)
    review_repo = ReviewRepository(db)

    vehicles = await vehicle_repo.get_by_owner(user.id)
    rentals = await booking_repo.get_by_renter(user.id)
    reviews = await review_repo.get_by_user(user.id)

    category = HonorService.calculate_category(user.honor_score)

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        profile_picture=user.profile_picture,
        driving_license_number=user.driving_license_number,
        address=user.address,
        bio=user.bio,
        honor_score=user.honor_score,
        is_verified=user.is_verified,
        is_admin=user.is_admin,
        is_suspended=user.is_suspended,
        created_at=user.created_at,
        vehicles_count=len(vehicles),
        bookings_count=len(rentals),
        reviews_count=len(reviews),
        honor_category=category,
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_service = UserService(db)
    return await user_service.update_profile(current_user.id, update_in)

@router.post("/verify-request", response_model=UserResponse)
async def request_verification(
    req: UserVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_service = UserService(db)
    return await user_service.request_verification(current_user.id, req)

@router.get("/honor-history", response_model=List[HonorScoreHistoryResponse])
async def get_honor_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    honor_service = HonorService(db)
    return await honor_service.get_user_history(current_user.id)
