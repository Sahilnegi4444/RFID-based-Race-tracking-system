from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkpoint import CheckpointRecord, CheckpointName
from app.schemas.checkpoint import CheckpointRecordCreate


async def get_records_for_runner(
    db: AsyncSession, army_number: str
) -> list[CheckpointRecord]:
    result = await db.execute(
        select(CheckpointRecord)
        .where(CheckpointRecord.army_number == army_number)
        .order_by(CheckpointRecord.recorded_at)
    )
    return result.scalars().all()


async def create_checkpoint_record(
    db: AsyncSession, army_number: str, data: CheckpointRecordCreate
) -> CheckpointRecord:
    record = CheckpointRecord(
        army_number=army_number,
        checkpoint=CheckpointName(data.checkpoint),
        recorded_at=data.recorded_at,
        reader_id=data.reader_id,
        race_session_id=data.race_session_id,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record
