from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.runner import Runner, RunnerStatus
from app.schemas.runner import RunnerCreate


from sqlalchemy.orm import selectinload


async def get_all_runners(db: AsyncSession) -> list[Runner]:
    result = await db.execute(
        select(Runner).options(selectinload(Runner.checkpoints)).order_by(Runner.created_at)
    )
    return result.scalars().all()


async def get_verified_runners(db: AsyncSession) -> list[Runner]:
    result = await db.execute(
        select(Runner)
        .where(Runner.verified == True)
        .options(selectinload(Runner.checkpoints))
        .order_by(Runner.created_at)
    )
    return result.scalars().all()


async def get_runner_by_rfid(db: AsyncSession, rfid_tag: str) -> Runner | None:
    result = await db.execute(select(Runner).where(Runner.rfid_tag == rfid_tag))
    return result.scalar_one_or_none()


async def get_runner_by_army_number(db: AsyncSession, army_number: str) -> Runner | None:
    result = await db.execute(select(Runner).where(Runner.army_number == army_number))
    return result.scalar_one_or_none()


async def create_runner(db: AsyncSession, data: RunnerCreate) -> Runner:
    runner = Runner(rfid_tag=data.rfid_tag, army_number=data.army_number)
    db.add(runner)
    await db.flush()
    # Re-fetch with selectinload to ensure checkpoints relation is loaded and serializable
    result = await db.execute(
        select(Runner)
        .where(Runner.army_number == data.army_number)
        .options(selectinload(Runner.checkpoints))
    )
    return result.scalar_one()


async def bulk_create_runners(db: AsyncSession, runners_data: list[RunnerCreate]) -> list[Runner]:
    """
    UPSERT runners — inserts new ones, updates existing ones on army_number conflict.
    Uses plain dicts so asyncpg doesn't choke on ORM-mapped returning().
    """
    if not runners_data:
        return []

    now = datetime.now(timezone.utc)
    values = [
        {
            "army_number": r.army_number,
            "rfid_tag": r.rfid_tag,
            "verified": r.verified,
            "verified_at": now if r.verified else None,
            "status": RunnerStatus.registered,   # ← lowercase, matches enum definition
            "created_at": now,
            "updated_at": now,
        }
        for r in runners_data
    ]

    # Build the UPSERT — on duplicate army_number, update RFID + verification fields
    stmt = (
        insert(Runner)
        .values(values)
        .on_conflict_do_update(
            index_elements=["army_number"],
            set_={
                "rfid_tag": insert(Runner).excluded.rfid_tag,
                "verified": insert(Runner).excluded.verified,
                "verified_at": insert(Runner).excluded.verified_at,
                "updated_at": now,
            },
        )
    )
    await db.execute(stmt)
    await db.flush()

    # Re-fetch the inserted/updated rows with selectinload to return full ORM objects
    army_numbers = [r.army_number for r in runners_data]
    result = await db.execute(
        select(Runner)
        .where(Runner.army_number.in_(army_numbers))
        .options(selectinload(Runner.checkpoints))
    )
    return result.scalars().all()


async def mark_verified(db: AsyncSession, runner: Runner) -> Runner:
    runner.verified = True
    runner.verified_at = datetime.now(timezone.utc)
    db.add(runner)
    await db.flush()
    await db.refresh(runner)
    return runner


async def update_runner_status(
    db: AsyncSession, runner: Runner, status: RunnerStatus
) -> Runner:
    runner.status = status
    db.add(runner)
    await db.flush()
    await db.refresh(runner)
    return runner


async def delete_runner(db: AsyncSession, runner: Runner) -> None:
    await db.delete(runner)
