from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.honor_service import HonorService
from app.core.config import settings

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.honor_service = HonorService(db)

    async def register_user(self, user_in: UserRegister):
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists."
            )

        hashed = get_password_hash(user_in.password)
        user_data = {
            "email": user_in.email,
            "hashed_password": hashed,
            "full_name": user_in.full_name,
            "phone": user_in.phone,
            "honor_score": 100,
            "is_verified": False,
            "is_admin": False,
            "is_suspended": False,
        }
        
        user = await self.user_repo.create(user_data)
        
        # Log initial honor score history entry
        await self.honor_service.adjust_score(
            user_id=user.id,
            points_change=0,  # Starting baseline
            reason="Welcome to RideSync! Baseline Honor Score initialized."
        )

        return user

    async def authenticate_user(self, credentials: UserLogin):
        user = await self.user_repo.get_by_email(credentials.email)
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.is_suspended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended due to policy violations."
            )

        access_token = create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer", "user": user}

    async def authenticate_google_user(self, token: str):
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
            email = idinfo.get('email')
            google_id = idinfo.get('sub')
            full_name = idinfo.get('name', 'Google User')
            profile_picture = idinfo.get('picture')
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )
        
        user = await self.user_repo.get_by_email(email)
        if not user:
            user_data = {
                "email": email,
                "hashed_password": None,
                "auth_provider": "google",
                "google_id": google_id,
                "full_name": full_name,
                "profile_picture": profile_picture,
                "honor_score": 100,
                "is_verified": False,
                "is_admin": False,
                "is_suspended": False,
            }
            user = await self.user_repo.create(user_data)
            await self.honor_service.adjust_score(
                user_id=user.id,
                points_change=0,
                reason="Welcome to RideSync via Google! Baseline Honor Score initialized."
            )
        else:
            if user.is_suspended:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account has been suspended due to policy violations."
                )

        access_token = create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer", "user": user}
