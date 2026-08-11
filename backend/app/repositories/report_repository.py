from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.models.report import Report
from app.repositories.base import BaseRepository

class ReportRepository(BaseRepository[Report]):
    def __init__(self, db: AsyncSession):
        super().__init__(Report, db)

    async def get_all_with_details(self, status: Optional[str] = None) -> List[Report]:
        stmt = select(Report).options(
            selectinload(Report.reporter),
            selectinload(Report.reported_user),
            selectinload(Report.reported_vehicle),
        )
        if status:
            stmt = stmt.where(Report.status == status)
        stmt = stmt.order_by(desc(Report.created_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_with_details(self, report_id: int) -> Optional[Report]:
        result = await self.db.execute(
            select(Report)
            .options(
                selectinload(Report.reporter),
                selectinload(Report.reported_user),
                selectinload(Report.reported_vehicle),
            )
            .where(Report.id == report_id)
        )
        return result.scalars().first()
