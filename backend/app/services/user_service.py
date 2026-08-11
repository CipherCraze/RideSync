from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate, UserVerificationRequest
from app.services.honor_service import HonorService
from app.services.notification_service import NotificationService

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.honor_service = HonorService(db)
        self.notification_service = NotificationService(db)

    async def get_user_by_id(self, user_id: int):
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_profile(self, user_id: int, update_data: UserUpdate):
        user = await self.get_user_by_id(user_id)
        updated = await self.user_repo.update(user, update_data.model_dump(exclude_unset=True))
        return updated

    async def request_verification(self, user_id: int, req: UserVerificationRequest):
        user = await self.get_user_by_id(user_id)
        user.driving_license_number = req.driving_license_number
        await self.user_repo.update(user, {"driving_license_number": req.driving_license_number})
        
        await self.notification_service.notify(
            user_id=user_id,
            title="Verification Submitted",
            message="Your driving license verification request has been submitted for admin review.",
            notification_type="ADMIN_VERIFICATION"
        )
        return user
