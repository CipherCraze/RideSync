from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.booking_repository import BookingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from app.services.honor_service import HonorService
from app.services.notification_service import NotificationService

class BookingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.vehicle_repo = VehicleRepository(db)
        self.user_repo = UserRepository(db)
        self.honor_service = HonorService(db)
        self.notification_service = NotificationService(db)

    async def create_booking(self, renter_id: int, booking_in: BookingCreate):
        if booking_in.start_date >= booking_in.end_date:
            raise HTTPException(status_code=400, detail="End date must be strictly after start date.")

        vehicle = await self.vehicle_repo.get_with_details(booking_in.vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found.")

        if not vehicle.is_approved or not vehicle.is_available:
            raise HTTPException(status_code=400, detail="Vehicle is not available for rental.")

        if vehicle.owner_id == renter_id:
            raise HTTPException(status_code=400, detail="You cannot rent your own vehicle.")

        renter = await self.user_repo.get(renter_id)
        if not renter or renter.is_suspended:
            raise HTTPException(status_code=403, detail="Renter account is suspended or invalid.")

        if renter.honor_score < 60:
            raise HTTPException(
                status_code=403,
                detail="Your Honor Score is in the Restricted range (< 60). You cannot place new rental requests."
            )

        # Check date overlap
        has_overlap = await self.booking_repo.check_overlapping_bookings(
            vehicle_id=vehicle.id,
            start_date=booking_in.start_date,
            end_date=booking_in.end_date,
        )
        if has_overlap:
            raise HTTPException(
                status_code=400,
                detail="Vehicle is already booked for the selected date range."
            )

        # Calculate total price
        duration = booking_in.end_date - booking_in.start_date
        hours = duration.total_seconds() / 3600
        days = max(0.1, hours / 24.0)
        total_price = round(days * vehicle.price_per_day, 2)

        booking = await self.booking_repo.create({
            "renter_id": renter_id,
            "vehicle_id": vehicle.id,
            "owner_id": vehicle.owner_id,
            "start_date": booking_in.start_date,
            "end_date": booking_in.end_date,
            "total_price": total_price,
            "status": "PENDING",
        })

        # Notify Owner
        await self.notification_service.notify(
            user_id=vehicle.owner_id,
            title="New Rental Booking Request",
            message=f"{renter.full_name} requested to rent your {vehicle.brand} {vehicle.model} for {days} day(s).",
            notification_type="BOOKING_REQUEST",
            link_url=f"/booking-requests"
        )

        return await self.booking_repo.get_with_details(booking.id)

    async def update_status(self, booking_id: int, user_id: int, update_in: BookingStatusUpdate):
        booking = await self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")

        user = await self.user_repo.get(user_id)
        is_owner = (booking.owner_id == user_id)
        is_renter = (booking.renter_id == user_id)
        is_admin = user.is_admin if user else False

        if not (is_owner or is_renter or is_admin):
            raise HTTPException(status_code=403, detail="Not authorized to update this booking.")

        new_status = update_in.status.upper()
        old_status = booking.status

        # Transition Rules
        if new_status == "CONFIRMED":
            if not (is_owner or is_admin):
                raise HTTPException(status_code=403, detail="Only the vehicle owner can accept booking requests.")
            if old_status != "PENDING":
                raise HTTPException(status_code=400, detail=f"Cannot confirm booking from status '{old_status}'.")
            
            await self.notification_service.notify(
                user_id=booking.renter_id,
                title="Booking Request Confirmed!",
                message=f"The owner confirmed your booking for {booking.vehicle.brand} {booking.vehicle.model}.",
                notification_type="BOOKING_ACCEPTED",
                link_url="/my-rentals"
            )

        elif new_status == "REJECTED":
            if not (is_owner or is_admin):
                raise HTTPException(status_code=403, detail="Only the vehicle owner can reject booking requests.")
            if old_status != "PENDING":
                raise HTTPException(status_code=400, detail=f"Cannot reject booking from status '{old_status}'.")

            await self.notification_service.notify(
                user_id=booking.renter_id,
                title="Booking Request Declined",
                message=f"Your booking request for {booking.vehicle.brand} {booking.vehicle.model} was declined.",
                notification_type="BOOKING_REJECTED",
                link_url="/my-rentals"
            )

        elif new_status == "RENTAL_ACTIVE":
            if old_status not in ["CONFIRMED", "PENDING"]:
                raise HTTPException(status_code=400, detail=f"Cannot set active rental from '{old_status}'.")

        elif new_status == "RETURNED":
            if old_status not in ["RENTAL_ACTIVE", "CONFIRMED"]:
                raise HTTPException(status_code=400, detail=f"Cannot mark returned from '{old_status}'.")
            
            await self.notification_service.notify(
                user_id=booking.owner_id if is_renter else booking.renter_id,
                title="Vehicle Returned",
                message=f"The {booking.vehicle.brand} {booking.vehicle.model} has been marked as returned.",
                notification_type="VEHICLE_RETURNED",
                link_url="/booking-requests" if is_owner else "/my-rentals"
            )

        elif new_status == "COMPLETED":
            if old_status not in ["RETURNED", "RENTAL_ACTIVE", "CONFIRMED"]:
                raise HTTPException(status_code=400, detail=f"Cannot complete booking from '{old_status}'.")

            # Reward Honor Score (+5 points to both)
            await self.honor_service.adjust_score(
                user_id=booking.renter_id,
                points_change=5,
                reason=f"Successful completion of rental #{booking.id}"
            )
            await self.honor_service.adjust_score(
                user_id=booking.owner_id,
                points_change=5,
                reason=f"Successful completion of vehicle rental #{booking.id}"
            )

        elif new_status == "CANCELLED":
            if old_status in ["COMPLETED", "RETURNED"]:
                raise HTTPException(status_code=400, detail="Completed rentals cannot be cancelled.")

            # Penalize honor score if cancelled after confirmation
            if old_status == "CONFIRMED":
                penalized_user_id = user_id
                await self.honor_service.adjust_score(
                    user_id=penalized_user_id,
                    points_change=-10,
                    reason=f"Cancellation of confirmed booking #{booking.id}"
                )
            
            if booking.payment_status == "PAID":
                # Mock refund flag
                booking.payment_status = "REFUNDED"

        updated_booking = await self.booking_repo.update(booking, {
            "status": new_status,
            "payment_status": booking.payment_status,
            "cancellation_reason": update_in.cancellation_reason if new_status == "CANCELLED" else booking.cancellation_reason
        })

        return await self.booking_repo.get_with_details(updated_booking.id)

    async def get_my_rentals(self, renter_id: int, status: Optional[str] = None):
        rentals = await self.booking_repo.get_by_renter(renter_id, status)
        return self._add_overdue_flags(rentals)

    async def get_incoming_requests(self, owner_id: int, status: Optional[str] = None):
        requests = await self.booking_repo.get_by_owner(owner_id, status)
        return self._add_overdue_flags(requests)

    async def get_booking_by_id(self, booking_id: int):
        booking = await self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Ensure end_date is naive if it isn't already for comparison
        end_date_naive = booking.end_date.replace(tzinfo=None) if booking.end_date.tzinfo else booking.end_date
        
        if booking.status == "RENTAL_ACTIVE" and end_date_naive < now:
            booking.is_overdue = True
        else:
            booking.is_overdue = False
            
        return booking

    def _add_overdue_flags(self, bookings):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        for b in bookings:
            end_date_naive = b.end_date.replace(tzinfo=None) if b.end_date.tzinfo else b.end_date
            if b.status == "RENTAL_ACTIVE" and end_date_naive < now:
                b.is_overdue = True
            else:
                b.is_overdue = False
        return bookings
