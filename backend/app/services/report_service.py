from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.repositories.report_repository import ReportRepository
from app.schemas.report import ReportCreate, ReportUpdate
from app.services.notification_service import NotificationService

class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.report_repo = ReportRepository(db)
        self.notification_service = NotificationService(db)

    async def create_report(self, reporter_id: int, report_in: ReportCreate):
        data = report_in.model_dump()
        data["reporter_id"] = reporter_id
        data["status"] = "PENDING"

        report = await self.report_repo.create(data)
        return await self.report_repo.get_with_details(report.id)

    async def get_all_reports(self, status: Optional[str] = None):
        return await self.report_repo.get_all_with_details(status)

    async def update_report(self, report_id: int, update_in: ReportUpdate):
        report = await self.report_repo.get_with_details(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        updated = await self.report_repo.update(report, update_in.model_dump(exclude_unset=True))
        return await self.report_repo.get_with_details(updated.id)
