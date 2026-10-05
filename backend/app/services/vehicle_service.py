from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.user_repository import UserRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleDocumentCreate
from app.services.notification_service import NotificationService

VALID_DOC_TYPES = {"RC", "PUC", "SERVICE_RECORD", "INSURANCE"}

class VehicleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.vehicle_repo = VehicleRepository(db)
        self.user_repo = UserRepository(db)
        self.booking_repo = BookingRepository(db)
        self.notification_service = NotificationService(db)

    async def create_vehicle(self, owner_id: int, vehicle_in: VehicleCreate):
        owner = await self.user_repo.get(owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")

        if owner.is_suspended:
            raise HTTPException(status_code=403, detail="Suspended users cannot list vehicles.")

        requested_status = (vehicle_in.status or "PENDING").upper()
        if requested_status not in ["DRAFT", "PENDING"]:
            requested_status = "PENDING"

        # Auto-approve if owner is admin
        auto_approved = owner.is_admin

        vehicle_dict = vehicle_in.model_dump(exclude={"images", "documents"})
        if auto_approved:
            vehicle_dict["status"] = "APPROVED"
            vehicle_dict["is_approved"] = True
        elif requested_status == "DRAFT":
            vehicle_dict["status"] = "DRAFT"
            vehicle_dict["is_approved"] = False
        else:
            vehicle_dict["status"] = "PENDING"
            vehicle_dict["is_approved"] = False

        vehicle_dict["owner_id"] = owner_id
        vehicle_dict["is_available"] = True
        vehicle_dict["rating_avg"] = 5.0
        vehicle_dict["rating_count"] = 0

        vehicle = await self.vehicle_repo.create(vehicle_dict)

        # Add images
        if vehicle_in.images:
            await self.vehicle_repo.add_images(vehicle.id, vehicle_in.images)

        # Add documents if attached
        if vehicle_in.documents:
            for doc in vehicle_in.documents:
                await self.add_document(vehicle.id, owner_id, doc)

        detailed_vehicle = await self.vehicle_repo.get_with_details(vehicle.id)

        if not auto_approved and requested_status == "PENDING":
            await self.notification_service.notify(
                user_id=owner_id,
                title="Listing Under Review",
                message=f"Your {vehicle.brand} {vehicle.model} listing has been submitted and is pending admin approval.",
                notif_type="ADMIN_VERIFICATION",
                link_url=f"/vehicles/{vehicle.id}"
            )
        
        return detailed_vehicle

    async def update_vehicle(self, vehicle_id: int, owner_id: int, vehicle_in: VehicleUpdate):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if vehicle.owner_id != owner_id:
            owner = await self.user_repo.get(owner_id)
            if not owner or not owner.is_admin:
                raise HTTPException(status_code=403, detail="Not authorized to update this vehicle")

        update_dict = vehicle_in.model_dump(exclude_unset=True, exclude={"images"})
        
        # If updating status
        if "status" in update_dict and update_dict["status"]:
            st = update_dict["status"].upper()
            update_dict["status"] = st
            if st == "APPROVED":
                update_dict["is_approved"] = True
                update_dict["rejection_reason"] = None
            elif st in ["DRAFT", "PENDING", "REJECTED"]:
                update_dict["is_approved"] = False

        updated = await self.vehicle_repo.update(vehicle, update_dict)

        if vehicle_in.images is not None:
            # Add images
            await self.vehicle_repo.add_images(vehicle.id, vehicle_in.images)

        return await self.vehicle_repo.get_with_details(vehicle.id)

    async def submit_for_review(self, vehicle_id: int, owner_id: int):
        vehicle = await self.vehicle_repo.get_with_details(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if vehicle.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Not authorized to submit this vehicle")

        vehicle.status = "PENDING"
        vehicle.is_approved = False
        vehicle.rejection_reason = None
        await self.db.commit()
        await self.db.refresh(vehicle)

        await self.notification_service.notify(
            user_id=owner_id,
            title="Vehicle Submitted for Verification",
            message=f"Your {vehicle.brand} {vehicle.model} has been submitted for admin verification.",
            notif_type="ADMIN_VERIFICATION",
            link_url=f"/vehicles/{vehicle.id}"
        )
        return vehicle

    async def add_document(self, vehicle_id: int, user_id: int, doc_in: VehicleDocumentCreate):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        user = await self.user_repo.get(user_id)
        if not user or (vehicle.owner_id != user_id and not user.is_admin):
            raise HTTPException(status_code=403, detail="Not authorized to add documents for this vehicle")

        doc_type = doc_in.document_type.upper()
        if doc_type not in VALID_DOC_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid document type '{doc_type}'. Allowed types: {list(VALID_DOC_TYPES)}")

        # Expiry date validation for PUC and Insurance
        if doc_in.expiry_date and doc_type in ["PUC", "INSURANCE"]:
            now = datetime.now(timezone.utc)
            exp = doc_in.expiry_date
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp < now:
                raise HTTPException(status_code=400, detail=f"{doc_type} certificate has expired on {exp.strftime('%Y-%m-%d')}. Please upload a valid document.")

        return await self.vehicle_repo.add_document(
            vehicle_id=vehicle_id,
            document_type=doc_type,
            document_url=doc_in.document_url,
            document_number=doc_in.document_number,
            expiry_date=doc_in.expiry_date,
            status="PENDING"
        )

    async def get_documents(self, vehicle_id: int):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return await self.vehicle_repo.get_documents(vehicle_id)

    async def delete_vehicle(self, vehicle_id: int, owner_id: int):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        if vehicle.owner_id != owner_id:
            owner = await self.user_repo.get(owner_id)
            if not owner or not owner.is_admin:
                raise HTTPException(status_code=403, detail="Not authorized to delete this vehicle")

        return await self.vehicle_repo.delete(vehicle_id)

    async def get_vehicle_by_id(self, vehicle_id: int):
        vehicle = await self.vehicle_repo.get_with_details(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return vehicle

    async def get_vehicle_availability(self, vehicle_id: int):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        bookings = await self.booking_repo.get_upcoming_for_vehicle(vehicle_id)
        return [{"start_date": b.start_date, "end_date": b.end_date} for b in bookings]

    async def search(self, **kwargs):
        return await self.vehicle_repo.search_vehicles(**kwargs)

    async def get_owner_vehicles(self, owner_id: int):
        return await self.vehicle_repo.get_by_owner(owner_id)

