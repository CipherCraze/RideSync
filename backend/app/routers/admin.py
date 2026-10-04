from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_admin
from app.schemas.admin import AdminAnalyticsResponse
from app.schemas.user import UserResponse
from app.schemas.vehicle import VehicleResponse
from app.schemas.report import ReportResponse, ReportUpdate
from app.schemas.honor import HonorScoreAdjustment, HonorScoreHistoryResponse
from app.schemas.review import ReviewResponse, ReviewModerationRequest
from app.services.admin_service import AdminService
from app.services.user_service import UserService
from app.services.vehicle_service import VehicleService
from app.services.report_service import ReportService
from app.services.honor_service import HonorService
from app.services.review_service import ReviewService
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_analytics(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_analytics()

@router.get("/pending-vehicles", response_model=List[VehicleResponse])
async def get_pending_vehicles(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    vehicle_service = VehicleService(db)
    return await vehicle_service.vehicle_repo.get_pending_approvals()

@router.put("/vehicles/{vehicle_id}/approve", response_model=VehicleResponse)
async def approve_vehicle(
    vehicle_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.approve_vehicle(vehicle_id)

@router.get("/pending-verifications", response_model=List[UserResponse])
async def get_pending_verifications(
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    user_service = UserService(db)
    return await user_service.user_repo.get_unverified_users()

@router.put("/users/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.verify_user(user_id)

@router.put("/users/{user_id}/suspend", response_model=UserResponse)
async def toggle_suspend_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.toggle_user_suspension(user_id)

@router.put("/users/honor-score", response_model=UserResponse)
async def adjust_user_honor_score(
    adj: HonorScoreAdjustment,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    honor_service = HonorService(db)
    user = await honor_service.adjust_score(
        user_id=adj.user_id,
        points_change=adj.points_change,
        reason=f"Admin Manual Adjustment: {adj.reason}",
        reference_type=adj.reference_type or "ADMIN_MANUAL",
        reference_id=adj.reference_id,
    )
    return user

@router.get("/users/{user_id}/honor-history", response_model=List[HonorScoreHistoryResponse])
async def get_user_honor_history_admin(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    honor_service = HonorService(db)
    return await honor_service.get_user_history(user_id)

@router.put("/reviews/{review_id}/moderate", response_model=ReviewResponse)
async def moderate_review(
    review_id: int,
    body: Optional[ReviewModerationRequest] = None,
    is_hidden: Optional[bool] = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    final_is_hidden = True
    if body is not None and body.is_hidden is not None:
        final_is_hidden = body.is_hidden
    elif is_hidden is not None:
        final_is_hidden = is_hidden

    review_service = ReviewService(db)
    return await review_service.hide_review(review_id, is_hidden=final_is_hidden)

@router.get("/reports", response_model=List[ReportResponse])
async def get_reports(
    status: Optional[str] = Query(None),
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    report_service = ReportService(db)
    return await report_service.get_all_reports(status)

@router.put("/reports/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    update_in: ReportUpdate,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    report_service = ReportService(db)
    return await report_service.update_report(report_id, update_in)

