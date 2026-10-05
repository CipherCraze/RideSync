from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from fastapi import HTTPException
from app.repositories.user_repository import UserRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.report_repository import ReportRepository
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.booking import Booking
from app.models.report import Report
from app.models.vehicle_document import VehicleDocument
from app.services.honor_service import HonorService
from app.services.notification_service import NotificationService

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.vehicle_repo = VehicleRepository(db)
        self.booking_repo = BookingRepository(db)
        self.report_repo = ReportRepository(db)
        self.honor_service = HonorService(db)
        self.notification_service = NotificationService(db)

    async def get_analytics(self):
        total_users = await self.user_repo.count()
        avg_honor = await self.user_repo.get_average_honor_score()
        
        # Verified users count
        res_v_users = await self.db.execute(select(func.count(User.id)).where(User.is_verified == True))
        verified_users = res_v_users.scalar() or 0

        # Vehicle counts
        total_vehicles = await self.vehicle_repo.count()
        res_p_veh = await self.db.execute(select(func.count(Vehicle.id)).where(or_(Vehicle.status == "PENDING", Vehicle.is_approved == False)))
        pending_vehicles = res_p_veh.scalar() or 0

        # Booking counts
        total_bookings = await self.booking_repo.count()
        res_act_b = await self.db.execute(select(func.count(Booking.id)).where(Booking.status.in_(["CONFIRMED", "RENTAL_ACTIVE"])))
        active_bookings = res_act_b.scalar() or 0

        res_comp_b = await self.db.execute(select(func.count(Booking.id)).where(Booking.status == "COMPLETED"))
        completed_bookings = res_comp_b.scalar() or 0

        # Report counts
        total_reports = await self.report_repo.count()
        res_p_rep = await self.db.execute(select(func.count(Report.id)).where(Report.status == "PENDING"))
        pending_reports = res_p_rep.scalar() or 0

        # Pending documents count
        res_p_doc = await self.db.execute(select(func.count(VehicleDocument.id)).where(VehicleDocument.status == "PENDING"))
        pending_documents = res_p_doc.scalar() or 0

        return {
            "total_users": total_users,
            "verified_users": verified_users,
            "total_vehicles": total_vehicles,
            "pending_vehicles": pending_vehicles,
            "total_bookings": total_bookings,
            "active_bookings": active_bookings,
            "completed_bookings": completed_bookings,
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "pending_documents": pending_documents,
            "average_honor_score": avg_honor,
        }

    async def verify_user(self, user_id: int):
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        await self.user_repo.update(user, {"is_verified": True})
        
        # Reward Honor score +10 for verified identity
        await self.honor_service.adjust_score(
            user_id=user_id,
            points_change=10,
            reason="Verified Identity & Driving License Approval"
        )

        await self.notification_service.notify(
            user_id=user_id,
            title="Account Verified!",
            message="Your driving license has been verified by RideSync admins! You earned +10 Honor Score points.",
            notif_type="ADMIN_VERIFICATION"
        )

        return user

    async def approve_vehicle(self, vehicle_id: int):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        await self.vehicle_repo.update(vehicle, {
            "status": "APPROVED",
            "is_approved": True,
            "rejection_reason": None,
        })

        await self.notification_service.notify(
            user_id=vehicle.owner_id,
            title="Vehicle Listing Approved",
            message=f"Your {vehicle.brand} {vehicle.model} listing has been approved and is now live on the marketplace!",
            notif_type="ADMIN_VERIFICATION",
            link_url=f"/vehicles/{vehicle.id}"
        )

        return await self.vehicle_repo.get_with_details(vehicle.id)

    async def reject_vehicle(self, vehicle_id: int, reason: str):
        vehicle = await self.vehicle_repo.get(vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")

        await self.vehicle_repo.update(vehicle, {
            "status": "REJECTED",
            "is_approved": False,
            "rejection_reason": reason,
        })

        await self.notification_service.notify(
            user_id=vehicle.owner_id,
            title="Vehicle Listing Needs Changes",
            message=f"Your {vehicle.brand} {vehicle.model} listing was not approved: {reason}. Please update the required details and resubmit.",
            notif_type="ADMIN_VERIFICATION",
            link_url=f"/vehicles/{vehicle.id}/edit"
        )

        return await self.vehicle_repo.get_with_details(vehicle.id)

    async def get_pending_documents(self):
        return await self.vehicle_repo.get_all_pending_documents()

    async def verify_document(self, doc_id: int, admin_id: int):
        doc = await self.vehicle_repo.get_document_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        updated_doc = await self.vehicle_repo.update_document_status(
            doc_id=doc_id,
            status="VERIFIED",
            verified_by_id=admin_id,
            rejection_reason=None
        )

        vehicle = await self.vehicle_repo.get(doc.vehicle_id)
        if vehicle:
            await self.notification_service.notify(
                user_id=vehicle.owner_id,
                title=f"{doc.document_type} Document Verified",
                message=f"Your {doc.document_type} for {vehicle.brand} {vehicle.model} has been verified by admin.",
                notif_type="ADMIN_VERIFICATION",
                link_url=f"/vehicles/{vehicle.id}"
            )

        return updated_doc

    async def reject_document(self, doc_id: int, admin_id: int, reason: str):
        doc = await self.vehicle_repo.get_document_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        updated_doc = await self.vehicle_repo.update_document_status(
            doc_id=doc_id,
            status="REJECTED",
            verified_by_id=admin_id,
            rejection_reason=reason
        )

        vehicle = await self.vehicle_repo.get(doc.vehicle_id)
        if vehicle:
            await self.notification_service.notify(
                user_id=vehicle.owner_id,
                title=f"{doc.document_type} Document Rejected",
                message=f"Your {doc.document_type} for {vehicle.brand} {vehicle.model} was rejected: {reason}.",
                notif_type="ADMIN_VERIFICATION",
                link_url=f"/vehicles/{vehicle.id}/edit"
            )

        return updated_doc

    async def toggle_user_suspension(self, user_id: int):
        user = await self.user_repo.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        new_state = not user.is_suspended
        await self.user_repo.update(user, {"is_suspended": new_state})

        status_str = "suspended" if new_state else "reactivated"
        await self.notification_service.notify(
            user_id=user_id,
            title=f"Account Status Changed: {status_str.capitalize()}",
            message=f"Your account has been {status_str} by platform administration.",
            notif_type="ADMIN_VERIFICATION"
        )

        return user
