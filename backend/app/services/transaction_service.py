from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.transaction import Transaction
from app.repositories.booking_repository import BookingRepository
from sqlalchemy import select

class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)

    async def process_mock_payment(self, booking_id: int, user_id: int, status: str = "SUCCESS"):
        booking = await self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")

        if booking.renter_id != user_id:
            raise HTTPException(status_code=403, detail="Only the renter can pay for this booking.")

        if booking.payment_status == "PAID":
            raise HTTPException(status_code=400, detail="Booking is already paid.")

        if booking.status not in ["PENDING", "CONFIRMED"]:
             raise HTTPException(status_code=400, detail="Booking cannot be paid in its current status.")

        transaction = Transaction(
            booking_id=booking.id,
            amount=booking.total_price,
            status=status
        )
        self.db.add(transaction)
        
        if status == "SUCCESS":
            booking.payment_status = "PAID"
            
        await self.db.commit()
        await self.db.refresh(transaction)
        return transaction

    async def get_booking_transactions(self, booking_id: int, user_id: int):
        booking = await self.booking_repo.get_with_details(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
            
        if booking.renter_id != user_id and booking.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized.")

        stmt = select(Transaction).where(Transaction.booking_id == booking_id)
        result = await self.db.execute(stmt)
        return result.scalars().all()
