from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.report_repository import ReportRepository
from app.repositories.review_repository import ReviewRepository
from app.repositories.booking_repository import BookingRepository
from app.schemas.report import ReportCreate, ReportUpdate
from app.services.notification_service import NotificationService
from app.services.honor_service import HonorService

class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.report_repo = ReportRepository(db)
        self.review_repo = ReviewRepository(db)
        self.booking_repo = BookingRepository(db)
        self.notification_service = NotificationService(db)
        self.honor_service = HonorService(db)

    async def create_report(self, reporter_id: int, report_in: ReportCreate):
        data = report_in.model_dump(exclude_unset=True)
        data["reporter_id"] = reporter_id
        data["status"] = "OPEN"
        data["details"] = report_in.details or report_in.description or "No details provided"
        if "vehicle_id" in data:
            if not data.get("reported_vehicle_id"):
                data["reported_vehicle_id"] = data.pop("vehicle_id")
            else:
                data.pop("vehicle_id")
        if "category" in data:
            if not data.get("reason"):
                data["reason"] = data.pop("category")
            else:
                data.pop("category")
        data.pop("description", None)

        # If reporting a review, associate the review's author if reported_user_id is not given
        if report_in.review_id:
            review = await self.review_repo.get(report_in.review_id)
            if review and not data.get("reported_user_id"):
                data["reported_user_id"] = review.reviewer_id

        # If reporting a booking
        if report_in.booking_id:
            booking = await self.booking_repo.get(report_in.booking_id)
            if booking and not data.get("reported_user_id"):
                data["reported_user_id"] = booking.owner_id if reporter_id == booking.renter_id else booking.renter_id

        report = await self.report_repo.create(data)

        # Notify reporter that report has been registered
        await self.notification_service.notify(
            user_id=reporter_id,
            type="REPORT_FILED",
            title="Report Submitted",
            message=f"Your report regarding '{report_in.reason}' has been submitted and is under review.",
            payload={"report_id": report.id, "reason": report_in.reason},
            link_url="/reports"
        )

        return await self.report_repo.get_with_details(report.id)

    async def get_all_reports(self, status: Optional[str] = None):
        return await self.report_repo.get_all_with_details(status)

    async def get_my_reports(self, reporter_id: int):
        return await self.report_repo.get_by_reporter(reporter_id)

    async def get_report_by_id(self, report_id: int):
        report = await self.report_repo.get_with_details(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report

    async def update_report(self, report_id: int, update_in: ReportUpdate):
        report = await self.report_repo.get_with_details(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        update_data = {
            "status": update_in.status.upper(),
        }
        if update_in.admin_notes is not None:
            update_data["admin_notes"] = update_in.admin_notes

        if update_in.status.upper() in ["RESOLVED", "REJECTED", "DISMISSED"]:
            update_data["resolved_at"] = datetime.now(timezone.utc)

        # Apply honor score penalty if specified
        if update_in.honor_score_penalty and report.reported_user_id:
            penalty = -abs(update_in.honor_score_penalty)
            await self.honor_service.adjust_score(
                user_id=report.reported_user_id,
                points_change=penalty,
                reason=f"Dispute Resolution Penalty on Report #{report.id}: {update_in.admin_notes or report.reason}",
                reference_type="REPORT",
                reference_id=report.id,
            )

        # Hide abusive review if requested
        if update_in.hide_review and report.review_id:
            await self.review_repo.set_hidden(report.review_id, is_hidden=True)

        updated = await self.report_repo.update(report, update_data)

        # Notify reporter
        await self.notification_service.notify(
            user_id=report.reporter_id,
            type="REPORT_STATUS_UPDATE",
            title=f"Report #{report.id} Status: {update_in.status}",
            message=f"Admin updated your dispute to {update_in.status}. Notes: {update_in.admin_notes or 'None'}",
            payload={"report_id": report.id, "status": update_in.status},
            link_url="/reports"
        )

        return await self.report_repo.get_with_details(updated.id)
