from datetime import datetime, timezone
from typing import Optional, List, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from app.models.vehicle import Vehicle
from app.models.vehicle_image import VehicleImage
from app.models.vehicle_document import VehicleDocument
from app.schemas.vehicle import VehicleImageCreate
from app.repositories.base import BaseRepository

class VehicleRepository(BaseRepository[Vehicle]):
    def __init__(self, db: AsyncSession):
        super().__init__(Vehicle, db)

    async def get_with_details(self, vehicle_id: int) -> Optional[Vehicle]:
        result = await self.db.execute(
            select(Vehicle)
            .options(
                selectinload(Vehicle.images),
                selectinload(Vehicle.documents),
                selectinload(Vehicle.owner)
            )
            .where(Vehicle.id == vehicle_id)
        )
        return result.scalars().first()

    async def get_by_owner(self, owner_id: int) -> List[Vehicle]:
        result = await self.db.execute(
            select(Vehicle)
            .options(
                selectinload(Vehicle.images),
                selectinload(Vehicle.documents)
            )
            .where(Vehicle.owner_id == owner_id)
            .order_by(desc(Vehicle.created_at))
        )
        return list(result.scalars().all())

    async def search_vehicles(
        self,
        query: Optional[str] = None,
        location: Optional[str] = None,
        brand: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        fuel_type: Optional[str] = None,
        transmission: Optional[str] = None,
        min_seats: Optional[int] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        sort_by: Optional[str] = "newest",
        is_approved_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Vehicle]:
        stmt = select(Vehicle).options(
            selectinload(Vehicle.images),
            selectinload(Vehicle.documents),
            selectinload(Vehicle.owner)
        )

        conditions = []
        if is_approved_only:
            conditions.append(or_(Vehicle.status == "APPROVED", Vehicle.is_approved == True))
            conditions.append(Vehicle.is_available == True)

        if query:
            q_pattern = f"%{query}%"
            conditions.append(
                or_(
                    Vehicle.brand.ilike(q_pattern),
                    Vehicle.model.ilike(q_pattern),
                    Vehicle.pickup_location.ilike(q_pattern),
                    Vehicle.description.ilike(q_pattern),
                )
            )

        if location:
            conditions.append(Vehicle.pickup_location.ilike(f"%{location}%"))
        if brand:
            conditions.append(Vehicle.brand.ilike(f"%{brand}%"))
        if vehicle_type:
            conditions.append(Vehicle.vehicle_type == vehicle_type)
        if fuel_type:
            conditions.append(Vehicle.fuel_type == fuel_type)
        if transmission:
            conditions.append(Vehicle.transmission == transmission)
        if min_seats:
            conditions.append(Vehicle.seats >= min_seats)
        if min_price is not None:
            conditions.append(Vehicle.price_per_day >= min_price)
        if max_price is not None:
            conditions.append(Vehicle.price_per_day <= max_price)
        if min_rating is not None:
            conditions.append(Vehicle.rating_avg >= min_rating)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        if sort_by == "price_asc":
            stmt = stmt.order_by(asc(Vehicle.price_per_day))
        elif sort_by == "price_desc":
            stmt = stmt.order_by(desc(Vehicle.price_per_day))
        elif sort_by == "rating_desc":
            stmt = stmt.order_by(desc(Vehicle.rating_avg))
        else:  # newest
            stmt = stmt.order_by(desc(Vehicle.created_at))

        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_pending_approvals(self) -> List[Vehicle]:
        result = await self.db.execute(
            select(Vehicle)
            .options(
                selectinload(Vehicle.images),
                selectinload(Vehicle.documents),
                selectinload(Vehicle.owner)
            )
            .where(or_(Vehicle.status == "PENDING", and_(Vehicle.is_approved == False, Vehicle.status != "REJECTED", Vehicle.status != "DRAFT")))
            .order_by(desc(Vehicle.created_at))
        )
        return list(result.scalars().all())

    async def add_images(self, vehicle_id: int, images_data: List[Union[str, VehicleImageCreate, dict]]) -> List[VehicleImage]:
        images = []
        for idx, item in enumerate(images_data):
            if isinstance(item, str):
                url = item
                angle = "OTHER"
                is_primary = (idx == 0)
            elif isinstance(item, VehicleImageCreate):
                url = item.image_url
                angle = item.angle or "OTHER"
                is_primary = item.is_primary or (idx == 0)
            elif isinstance(item, dict):
                url = item.get("image_url", "")
                angle = item.get("angle", "OTHER")
                is_primary = item.get("is_primary", idx == 0)
            else:
                continue

            img = VehicleImage(
                vehicle_id=vehicle_id,
                image_url=url,
                angle=angle,
                is_primary=is_primary
            )
            self.db.add(img)
            images.append(img)
        await self.db.commit()
        return images

    async def add_document(
        self,
        vehicle_id: int,
        document_type: str,
        document_url: str,
        document_number: Optional[str] = None,
        expiry_date: Optional[datetime] = None,
        status: str = "PENDING"
    ) -> VehicleDocument:
        doc = VehicleDocument(
            vehicle_id=vehicle_id,
            document_type=document_type.upper(),
            document_url=document_url,
            document_number=document_number,
            expiry_date=expiry_date,
            status=status,
            uploaded_at=datetime.now(timezone.utc)
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def get_documents(self, vehicle_id: int) -> List[VehicleDocument]:
        result = await self.db.execute(
            select(VehicleDocument)
            .where(VehicleDocument.vehicle_id == vehicle_id)
            .order_by(VehicleDocument.uploaded_at)
        )
        return list(result.scalars().all())

    async def get_document_by_id(self, doc_id: int) -> Optional[VehicleDocument]:
        result = await self.db.execute(
            select(VehicleDocument).where(VehicleDocument.id == doc_id)
        )
        return result.scalars().first()

    async def get_all_pending_documents(self) -> List[VehicleDocument]:
        result = await self.db.execute(
            select(VehicleDocument)
            .where(VehicleDocument.status == "PENDING")
            .order_by(VehicleDocument.uploaded_at)
        )
        return list(result.scalars().all())

    async def update_document_status(
        self,
        doc_id: int,
        status: str,
        verified_by_id: Optional[int] = None,
        rejection_reason: Optional[str] = None
    ) -> Optional[VehicleDocument]:
        doc = await self.get_document_by_id(doc_id)
        if not doc:
            return None
        doc.status = status
        doc.verified_by_id = verified_by_id
        doc.rejection_reason = rejection_reason
        doc.verified_at = datetime.now(timezone.utc) if status == "VERIFIED" else None
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
