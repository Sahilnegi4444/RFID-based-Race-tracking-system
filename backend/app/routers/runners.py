from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import runner as crud
from app.database import get_db
from app.models.runner import RunnerStatus
from app.schemas.runner import RunnerBulkCreate, RunnerCreate, RunnerRead, RunnerStatusUpdate

router = APIRouter(prefix="/runners", tags=["runners"])


@router.get("/", response_model=list[RunnerRead])
async def list_runners(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_runners(db)


@router.get("/verified", response_model=list[RunnerRead])
async def list_verified_runners(db: AsyncSession = Depends(get_db)):
    """Return only runners who passed internal server verification."""
    return await crud.get_verified_runners(db)


@router.post("/", response_model=RunnerRead, status_code=status.HTTP_201_CREATED)
async def create_runner(data: RunnerCreate, db: AsyncSession = Depends(get_db)):
    existing = await crud.get_runner_by_army_number(db, data.army_number)
    if existing:
        raise HTTPException(400, f"Army number '{data.army_number}' already registered.")
    return await crud.create_runner(db, data)


@router.post("/bulk", response_model=list[RunnerRead], status_code=status.HTTP_201_CREATED)
async def bulk_create_runners(payload: RunnerBulkCreate, db: AsyncSession = Depends(get_db)):
    """Bulk-register runners from CSV upload."""
    return await crud.bulk_create_runners(db, payload.runners)


@router.get("/{army_number}", response_model=RunnerRead)
async def get_runner(army_number: str, db: AsyncSession = Depends(get_db)):
    runner = await crud.get_runner_by_army_number(db, army_number)
    if not runner:
        raise HTTPException(404, "Runner not found.")
    return runner


@router.patch("/{army_number}/status", response_model=RunnerRead)
async def update_status(
    army_number: str, data: RunnerStatusUpdate, db: AsyncSession = Depends(get_db)
):
    runner = await crud.get_runner_by_army_number(db, army_number)
    if not runner:
        raise HTTPException(404, "Runner not found.")
    try:
        new_status = RunnerStatus(data.status)
    except ValueError:
        raise HTTPException(400, f"Invalid status '{data.status}'.")
    return await crud.update_runner_status(db, runner, new_status)


@router.delete("/{army_number}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_runner(army_number: str, db: AsyncSession = Depends(get_db)):
    runner = await crud.get_runner_by_army_number(db, army_number)
    if not runner:
        raise HTTPException(404, "Runner not found.")
    await crud.delete_runner(db, runner)
