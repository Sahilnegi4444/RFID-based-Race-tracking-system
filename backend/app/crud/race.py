from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.race_session import RaceSession, RaceCategory, RaceStatus
from app.models.race_result import RaceResult
from app.models.checkpoint import CheckpointRecord, CheckpointName
from app.schemas.race import RaceSessionCreate


async def get_active_race(db: AsyncSession) -> RaceSession | None:
    result = await db.execute(
        select(RaceSession).where(RaceSession.status == RaceStatus.active)
    )
    return result.scalar_one_or_none()


async def get_all_races(db: AsyncSession) -> list[RaceSession]:
    result = await db.execute(
        select(RaceSession).order_by(RaceSession.created_at.desc())
    )
    return result.scalars().all()


async def get_race_by_id(db: AsyncSession, race_id) -> RaceSession | None:
    result = await db.execute(
        select(RaceSession).where(RaceSession.id == race_id)
    )
    return result.scalar_one_or_none()


async def create_race_session(
    db: AsyncSession, data: RaceSessionCreate
) -> RaceSession:
    race = RaceSession(
        category=RaceCategory(data.category),
        custom_name=data.custom_name,
    )
    db.add(race)
    await db.flush()
    await db.refresh(race)
    return race


async def start_race(db: AsyncSession, race: RaceSession) -> RaceSession:
    race.status = RaceStatus.active
    race.started_at = datetime.now(timezone.utc)
    db.add(race)
    await db.flush()
    await db.refresh(race)
    return race


async def finish_race(
    db: AsyncSession, race: RaceSession, verified_runners: list
) -> tuple[RaceSession, list[RaceResult]]:
    """
    Marks the race as finished, then snapshots final standings
    into race_results for permanent archival.
    """
    race.status = RaceStatus.finished
    race.finished_at = datetime.now(timezone.utc)
    db.add(race)

    cp_order = [
        CheckpointName.finish,
        CheckpointName.checkpoint2,
        CheckpointName.checkpoint1,
        CheckpointName.start,
    ]

    def cp_time(records: list[CheckpointRecord], cp: CheckpointName):
        hits = [r for r in records if r.checkpoint == cp]
        return min(hits, key=lambda r: r.recorded_at).recorded_at if hits else None

    # Build leaderboard: sort by checkpoints crossed desc, then earliest finish asc
    runner_data = []
    for runner in verified_runners:
        records = await db.execute(
            select(CheckpointRecord).where(
                CheckpointRecord.army_number == runner.army_number,
                CheckpointRecord.race_session_id == race.id,
            )
        )
        records = records.scalars().all()

        start_t = cp_time(records, CheckpointName.start)
        cp1_t   = cp_time(records, CheckpointName.checkpoint1)
        cp2_t   = cp_time(records, CheckpointName.checkpoint2)
        fin_t   = cp_time(records, CheckpointName.finish)

        crossed = sum(1 for t in [start_t, cp1_t, cp2_t, fin_t] if t)

        total_sec = None
        if start_t and fin_t:
            total_sec = int((fin_t - start_t).total_seconds())

        runner_data.append({
            "runner": runner,
            "start_t": start_t, "cp1_t": cp1_t, "cp2_t": cp2_t, "fin_t": fin_t,
            "crossed": crossed, "total_sec": total_sec,
        })

    # Rank: most checkpoints first; for ties, earliest finish time wins
    runner_data.sort(
        key=lambda x: (
            -x["crossed"],
            x["fin_t"] or datetime.max.replace(tzinfo=timezone.utc),
        )
    )

    results = []
    for rank, rd in enumerate(runner_data, start=1):
        result = RaceResult(
            race_session_id=race.id,
            army_number=rd["runner"].army_number,
            rfid_tag=rd["runner"].rfid_tag,
            start_time=rd["start_t"],
            checkpoint1_time=rd["cp1_t"],
            checkpoint2_time=rd["cp2_t"],
            finish_time=rd["fin_t"],
            total_time_seconds=rd["total_sec"],
            rank=rank,
            status=rd["runner"].status.value,
        )
        db.add(result)
        results.append(result)

    await db.flush()
    await db.refresh(race)
    return race, results


async def get_race_results(db: AsyncSession, race_id) -> list[RaceResult]:
    result = await db.execute(
        select(RaceResult)
        .where(RaceResult.race_session_id == race_id)
        .order_by(RaceResult.rank)
    )
    return result.scalars().all()
