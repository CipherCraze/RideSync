from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.booking import (
    BookingCreate,
    BookingStatusUpdate,
    BookingDetailResponse,
    RadiusProposalRequest,
    RadiusProposalDecision
)
from app.schemas.transaction import TransactionResponse
from app.services.booking_service import BookingService
from app.services.transaction_service import TransactionService
from app.models.user import User

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/", response_model=BookingDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    return await service.create_booking(current_user.id, booking_in)

@router.get("/my-rentals", response_model=List[BookingDetailResponse])
async def get_my_rentals(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    return await service.get_my_rentals(current_user.id, status)

@router.get("/incoming-requests", response_model=List[BookingDetailResponse])
async def get_incoming_requests(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    return await service.get_incoming_requests(current_user.id, status)

@router.get("/{booking_id}", response_model=BookingDetailResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    return await service.get_booking_by_id(booking_id)

@router.put("/{booking_id}/status", response_model=BookingDetailResponse)
async def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    return await service.update_status(booking_id, current_user.id, status_update)

@router.post("/{booking_id}/propose-radius", response_model=BookingDetailResponse)
async def propose_booking_radius(
    booking_id: int,
    req: RadiusProposalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Propose an agreed permitted operational radius for this rental trip.
    """
    service = BookingService(db)
    return await service.propose_radius(booking_id, current_user.id, req.proposed_radius_km)

@router.post("/{booking_id}/respond-radius", response_model=BookingDetailResponse)
async def respond_booking_radius(
    booking_id: int,
    decision: RadiusProposalDecision,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accept or reject a proposed permitted radius for this rental trip.
    """
    service = BookingService(db)
    return await service.respond_to_radius_proposal(booking_id, current_user.id, decision.action)

@router.post("/{booking_id}/pay", response_model=TransactionResponse)
async def process_mock_payment(
    booking_id: int,
    status: str = Query("SUCCESS"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TransactionService(db)
    return await service.process_mock_payment(booking_id, current_user.id, status)

@router.get("/{booking_id}/receipt", response_model=List[TransactionResponse])
async def get_booking_receipt(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TransactionService(db)
    return await service.get_booking_transactions(booking_id, current_user.id)
