from datetime import datetime, timezone

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
    Looks up the runner by rfid_tag, then saves the record keyed to army_number.
    
    If testing with 1 physical reader, we automatically advance the checkpoint sequence:
    start -> checkpoint1 -> checkpoint2 -> finish
    """
    # Resolve the current active/pending race session if not explicitly provided
    if not data.race_session_id:
        from app.models.race_session import RaceSession, RaceStatus
        from sqlalchemy import select
        result = await db.execute(
            select(RaceSession)
            .where(RaceSession.status != RaceStatus.finished)
            .order_by(RaceSession.created_at.desc())
        )
        current_race = result.scalar_one_or_none()
        if current_race:
            data.race_session_id = current_race.id
        else:
            raise HTTPException(
                status_code=400,
                detail="No active or pending race session found to record checkpoints."
            )

    runner = await runner_crud.get_runner_by_rfid(db, data.rfid_tag)
    if not runner:
        raise HTTPException(status_code=404, detail=f"Runner with RFID '{data.rfid_tag}' not found.")

    # Fetch existing records to check what this runner has crossed in the current race session
    existing = await crud.get_records_for_runner(db, runner.army_number)
    
    # Filter for the current race session ID
    session_cps = {r.checkpoint for r in existing if str(r.race_session_id) == str(data.race_session_id)}
    
    from app.models.checkpoint import CheckpointName
    from app.models.runner import RunnerStatus
    
    if CheckpointName.start not in session_cps:
        next_cp = CheckpointName.start
    elif CheckpointName.checkpoint1 not in session_cps:
        next_cp = CheckpointName.checkpoint1
    elif CheckpointName.checkpoint2 not in session_cps:
        next_cp = CheckpointName.checkpoint2
    elif CheckpointName.finish not in session_cps:
        next_cp = CheckpointName.finish
    else:
        # Already finished, re-log finish
        next_cp = CheckpointName.finish

    # Set the computed checkpoint
    data.checkpoint = next_cp.value

    # Create the checkpoint record in the DB
    record = await crud.create_checkpoint_record(db, runner.army_number, data)
    
    # Keep the runner status in sync with their race progression
    if next_cp == CheckpointName.start:
        await runner_crud.update_runner_status(db, runner, RunnerStatus.running)
    elif next_cp == CheckpointName.finish:
        await runner_crud.update_runner_status(db, runner, RunnerStatus.finished)

    return record


@router.get("/{army_number}", response_model=list[CheckpointRecordRead])
async def get_runner_checkpoints(army_number: str, db: AsyncSession = Depends(get_db)):
    """Return all checkpoint records for a runner ordered by time."""
    runner = await runner_crud.get_runner_by_army_number(db, army_number)
    if not runner:
        raise HTTPException(status_code=404, detail="Runner not found.")
    return await crud.get_records_for_runner(db, runner.army_number)
