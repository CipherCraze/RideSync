from typing import List, Optional
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.vehicle_image import VehicleImage
from app.models.review import Review
from app.services.honor_service import HonorService
from app.schemas.user import UserPublicCard, UserPublicDetail, UserListingSummary

class UserDiscoveryService:
    """
    Handles user queries and public profile projections across the marketplace.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_users(
        self,
        query: Optional[str] = None,
        role: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[UserPublicCard]:
        """
        Searches users across the community marketplace and returns public cards
        with their active vehicle listings.
        """
        stmt = (
            select(User)
            .options(
                selectinload(User.vehicles).selectinload(Vehicle.images)
            )
            .filter(User.is_suspended == False)
        )

        if query and query.strip():
            term = f"%{query.strip().lower()}%"
            stmt = stmt.filter(
                or_(
                    func.lower(User.full_name).like(term),
                    func.lower(User.email).like(term),
                    func.lower(User.bio).like(term),
                    User.phone.like(term)
                )
            )

        stmt = stmt.order_by(User.honor_score.desc(), User.created_at.desc()).offset(skip).limit(limit)
        res = await self.db.execute(stmt)
        users = res.scalars().all()

        results = []
        for u in users:
            # Filter approved, available vehicles
            active_vehicles = [v for v in u.vehicles if v.status == "APPROVED"]
            if role == "OWNER" and len(active_vehicles) == 0:
                continue
            if role == "RENTER" and len(active_vehicles) > 0:
                continue

            summaries = []
            for v in active_vehicles[:4]:
                primary_img = next((img.image_url for img in v.images if img.is_primary), None)
                if not primary_img and v.images:
                    primary_img = v.images[0].image_url

                summaries.append(
                    UserListingSummary(
                        id=v.id,
                        brand=v.brand,
                        model=v.model,
                        year=v.year,
                        vehicle_type=v.vehicle_type,
                        price_per_day=v.price_per_day,
                        pickup_location=v.pickup_location,
                        rating_avg=v.rating_avg,
                        primary_image_url=primary_img
                    )
                )

            category = HonorService.calculate_category(u.honor_score)
            results.append(
                UserPublicCard(
                    id=u.id,
                    full_name=u.full_name,
                    email=u.email,
                    phone=u.phone,
                    profile_picture=u.profile_picture,
                    bio=u.bio,
                    honor_score=u.honor_score,
                    honor_category=category,
                    is_verified=u.is_verified,
                    created_at=u.created_at,
                    active_listings_count=len(active_vehicles),
                    active_listings=summaries
                )
            )

        return results

    async def get_user_public_profile(self, user_id: int) -> UserPublicDetail:
        """
        Retrieves a user's full public profile, including reputation, reviews count,
        and active listings.
        """
        stmt = (
            select(User)
            .options(
                selectinload(User.vehicles).selectinload(Vehicle.images)
            )
            .filter(User.id == user_id, User.is_suspended == False)
        )
        res = await self.db.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        active_vehicles = [v for v in user.vehicles if v.status == "APPROVED"]
        summaries = []
        for v in active_vehicles:
            primary_img = next((img.image_url for img in v.images if img.is_primary), None)
            if not primary_img and v.images:
                primary_img = v.images[0].image_url

            summaries.append(
                UserListingSummary(
                    id=v.id,
                    brand=v.brand,
                    model=v.model,
                    year=v.year,
                    vehicle_type=v.vehicle_type,
                    price_per_day=v.price_per_day,
                    pickup_location=v.pickup_location,
                    rating_avg=v.rating_avg,
                    primary_image_url=primary_img
                )
            )

        # Reviews received
        rev_stmt = select(func.count(Review.id), func.avg(Review.rating)).filter(
            Review.reviewee_id == user_id,
            Review.is_hidden == False
        )
        rev_res = await self.db.execute(rev_stmt)
        rev_count, rev_avg = rev_res.one()

        category = HonorService.calculate_category(user.honor_score)

        return UserPublicDetail(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            profile_picture=user.profile_picture,
            bio=user.bio,
            honor_score=user.honor_score,
            honor_category=category,
            is_verified=user.is_verified,
            created_at=user.created_at,
            active_listings_count=len(active_vehicles),
            active_listings=summaries,
            reviews_count=rev_count or 0,
            rating_avg=round(float(rev_avg or 5.0), 1)
        )
