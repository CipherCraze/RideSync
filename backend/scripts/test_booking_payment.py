import asyncio
import os
import sys

# Add backend parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.repositories.booking_repository import BookingRepository
from app.services.booking_service import BookingService
from app.services.transaction_service import TransactionService
from app.schemas.booking import BookingStatusUpdate
from fastapi import HTTPException

async def run_tests():
    print("Running Booking and Payment Consistency Tests...")
    
    async with AsyncSessionLocal() as db:
        booking_service = BookingService(db)
        transaction_service = TransactionService(db)
        
        # We assume seed_data has been run and booking 4 is PENDING.
        # Find a pending booking
        bookings = await booking_service.booking_repo.get_by_owner(3) # Sarah's ID is 3
        pending_booking = next((b for b in bookings if b.status == "PENDING"), None)
        
        if not pending_booking:
            print("No pending booking found. Please run seed.py first.")
            return

        print(f"Testing with Booking ID {pending_booking.id}")
        
        # Test 1: Confirm Booking
        print("Test 1: Confirm Booking")
        try:
            update = BookingStatusUpdate(status="CONFIRMED")
            confirmed = await booking_service.update_status(pending_booking.id, pending_booking.owner_id, update)
            assert confirmed.status == "CONFIRMED"
            print("  ✓ Confirmed successfully")
        except Exception as e:
            print(f"  ✗ Confirmation failed: {e}")
            
        # Test 2: Process Mock Payment
        print("Test 2: Process Mock Payment")
        try:
            tx = await transaction_service.process_mock_payment(pending_booking.id, pending_booking.renter_id, "SUCCESS")
            assert tx.status == "SUCCESS"
            
            # Verify payment_status updated
            b = await booking_service.get_booking_by_id(pending_booking.id)
            assert b.payment_status == "PAID"
            print("  ✓ Payment successful and status updated to PAID")
        except Exception as e:
            print(f"  ✗ Payment failed: {e}")
            
        # Test 3: Duplicate Payment Prevention
        print("Test 3: Prevent duplicate payment")
        try:
            await transaction_service.process_mock_payment(pending_booking.id, pending_booking.renter_id, "SUCCESS")
            print("  ✗ Duplicate payment was allowed!")
        except HTTPException as e:
            assert e.status_code == 400
            print("  ✓ Duplicate payment correctly blocked")
            
        # Test 4: Refund flag on cancellation
        print("Test 4: Cancellation changes payment_status to REFUNDED")
        try:
            update = BookingStatusUpdate(status="CANCELLED", cancellation_reason="Change of plans")
            cancelled = await booking_service.update_status(pending_booking.id, pending_booking.renter_id, update)
            assert cancelled.status == "CANCELLED"
            assert cancelled.payment_status == "REFUNDED"
            print("  ✓ Cancelled successfully and refund flag set")
        except Exception as e:
            print(f"  ✗ Cancellation failed: {e}")

    print("All tests completed.")

if __name__ == "__main__":
    asyncio.run(run_tests())
