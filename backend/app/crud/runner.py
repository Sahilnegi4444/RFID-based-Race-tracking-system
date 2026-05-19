from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.runner import Runner, RunnerStatus
from app.schemas.runner import RunnerCreate


async def get_all_runners(db: AsyncSession) -> list[Runner]:
    result = await db.execute(select(Runner).order_by(Runner.created_at))
    return result.scalars().all()


async def get_verified_runners(db: AsyncSession) -> list[Runner]:
    result = await db.execute(
        select(Runner).where(Runner.verified == True).order_by(Runner.created_at)
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
    await db.refresh(runner)
    return runner


async def bulk_create_runners(db: AsyncSession, runners_data: list[RunnerCreate]) -> list[Runner]:
    runners = [
        Runner(rfid_tag=r.rfid_tag, army_number=r.army_number) for r in runners_data
    ]
    db.add_all(runners)
    await db.flush()
    for r in runners:
        await db.refresh(r)
    return runners


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
