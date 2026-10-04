from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.honor import HonorScoreResponse, HonorScoreHistoryResponse
from app.services.honor_service import HonorService

router = APIRouter(prefix="/honor", tags=["Honor Score"])

@router.get("/score", response_model=HonorScoreResponse)
async def get_my_honor_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    honor_service = HonorService(db)
    return await honor_service.get_current_score(current_user.id)

@router.get("/history", response_model=List[HonorScoreHistoryResponse])
async def get_my_honor_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    honor_service = HonorService(db)
    return await honor_service.get_user_history(current_user.id)
