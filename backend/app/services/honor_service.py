from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.repositories.honor_repository import HonorRepository
from app.models.user import User

class HonorService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.honor_repo = HonorRepository(db)

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

    async def adjust_score(self, user_id: int, points_change: int, reason: str) -> User:
        user = await self.user_repo.get(user_id)
        if not user:
            raise ValueError(f"User with ID {user_id} not found")

        prev_score = user.honor_score
        new_score = max(0, min(100, prev_score + points_change))
        category = self.calculate_category(new_score)

        user.honor_score = new_score
        await self.user_repo.update(user, {"honor_score": new_score})

        # Add history log
        await self.honor_repo.create({
            "user_id": user_id,
            "points_change": points_change,
            "previous_score": prev_score,
            "new_score": new_score,
            "category": category,
            "reason": reason,
        })

        return user

    async def get_user_history(self, user_id: int):
        return await self.honor_repo.get_by_user(user_id)
