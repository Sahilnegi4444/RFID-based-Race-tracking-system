from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import checkpoint as crud
from app.crud import runner as runner_crud
from app.database import get_db
from app.schemas.checkpoint import CheckpointRecordCreate, CheckpointRecordRead

router = APIRouter(prefix="/checkpoints", tags=["checkpoints"])


@router.post("/record", response_model=CheckpointRecordRead, status_code=status.HTTP_201_CREATED)
async def record_checkpoint(data: CheckpointRecordCreate, db: AsyncSession = Depends(get_db)):
    """
    Record a single RFID read at a checkpoint gate.
    Called by the RFID reader integration (or mock).
    """
    runner = await runner_crud.get_runner_by_rfid(db, data.rfid_tag)
    if not runner:
        raise HTTPException(status_code=404, detail=f"Runner with RFID '{data.rfid_tag}' not found")
    return await crud.create_checkpoint_record(db, runner.id, data)


@router.get("/{rfid_tag}", response_model=list[CheckpointRecordRead])
async def get_runner_checkpoints(rfid_tag: str, db: AsyncSession = Depends(get_db)):
    """Return all checkpoint records for a runner, ordered by time."""
    runner = await runner_crud.get_runner_by_rfid(db, rfid_tag)
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found")
    return await crud.get_records_for_runner(db, runner.id)
