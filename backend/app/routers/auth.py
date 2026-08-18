from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import UserRegister, UserLogin, Token, GoogleLoginRequest, LoginResponse
from app.schemas.user import UserProfileResponse, UserResponse
from app.services.auth_service import AuthService
from app.services.honor_service import HonorService
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.review_repository import ReviewRepository
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.register_user(user_in)

@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.authenticate_user(credentials)

@router.post("/google", response_model=LoginResponse)
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.authenticate_google_user(request.token)

@router.get("/me", response_model=UserProfileResponse)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    vehicle_repo = VehicleRepository(db)
    booking_repo = BookingRepository(db)
    review_repo = ReviewRepository(db)

    vehicles = await vehicle_repo.get_by_owner(current_user.id)
    rentals = await booking_repo.get_by_renter(current_user.id)
    reviews = await review_repo.get_by_user(current_user.id)

    category = HonorService.calculate_category(current_user.honor_score)

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        profile_picture=current_user.profile_picture,
        driving_license_number=current_user.driving_license_number,
        address=current_user.address,
        bio=current_user.bio,
        honor_score=current_user.honor_score,
        is_verified=current_user.is_verified,
        is_admin=current_user.is_admin,
        is_suspended=current_user.is_suspended,
        created_at=current_user.created_at,
        vehicles_count=len(vehicles),
        bookings_count=len(rentals),
        reviews_count=len(reviews),
        honor_category=category,
    )
