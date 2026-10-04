from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.repositories.user_repository import UserRepository
from app.repositories.honor_repository import HonorRepository
from app.services.notification_service import NotificationService
from app.models.user import User

class HonorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.honor_repo = HonorRepository(db)
        self.notification_service = NotificationService(db)

    @staticmethod
    def calculate_category(score: int) -> str:
        if score >= 95:
            return "Trusted"
        elif score >= 80:
            return "Good"
        elif score >= 60:
            return "Warning"
        else:
            return "Restricted"

    async def get_current_score(self, user_id: int) -> dict:
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return {
            "user_id": user.id,
            "honor_score": user.honor_score,
            "category": self.calculate_category(user.honor_score)
        }

    async def adjust_score(
        self,
        user_id: int,
        points_change: int,
        reason: str,
        reference_type: Optional[str] = "ADMIN_MANUAL",
        reference_id: Optional[int] = None,
    ) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")

        prev_score = user.honor_score
        new_score = max(0, min(100, prev_score + points_change))
        category = self.calculate_category(new_score)

        user.honor_score = new_score
        await self.user_repo.update(user, {"honor_score": new_score})

        # Add audit history log preserving full history
        await self.honor_repo.create({
            "user_id": user_id,
            "points_change": points_change,
            "previous_score": prev_score,
            "new_score": new_score,
            "category": category,
            "reason": reason,
            "reference_type": reference_type,
            "reference_id": reference_id,
        })

        # Send notification to the user
        change_sign = f"+{points_change}" if points_change > 0 else f"{points_change}"
        await self.notification_service.notify(
            user_id=user_id,
            type="HONOR_ADJUSTMENT",
            title="Honor Score Updated",
            message=f"Your Honor Score was updated ({change_sign} pts). Reason: {reason}",
            payload={
                "old_score": prev_score,
                "new_score": new_score,
                "change": points_change,
                "reason": reason,
            },
            link_url="/profile",
        )

        return user

    async def get_user_history(self, user_id: int):
        return await self.honor_repo.get_by_user(user_id)
