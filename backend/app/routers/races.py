import csv
import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import race as crud
from app.crud.runner import get_verified_runners
from app.database import get_db
from app.models.race_session import RaceStatus
from app.schemas.race import RaceSessionCreate, RaceSessionRead, RaceResultRead

router = APIRouter(prefix="/races", tags=["races"])


@router.get("/", response_model=list[RaceSessionRead])
async def list_races(db: AsyncSession = Depends(get_db)):
    """List all race sessions (newest first)."""
    return await crud.get_all_races(db)


@router.post("/", response_model=RaceSessionRead, status_code=status.HTTP_201_CREATED)
async def create_race(data: RaceSessionCreate, db: AsyncSession = Depends(get_db)):
    """Create a new race session (stays in 'pending' until started)."""
    active = await crud.get_active_race(db)
    if active:
        raise HTTPException(400, "A race is already active. Finish it before creating a new one.")
    if data.category == "others" and not data.custom_name:
        raise HTTPException(400, "custom_name is required when category is 'others'.")

    # Clear transient runners and their records to ensure a completely fresh start for the new race
    from app.models.runner import Runner
    from sqlalchemy import delete
    await db.execute(delete(Runner))

    return await crud.create_race_session(db, data)


@router.post("/{race_id}/start", response_model=RaceSessionRead)
async def start_race(race_id: str, db: AsyncSession = Depends(get_db)):
    """Start a pending race — arms the RFID readers (simulation mode for now)."""
    race = await crud.get_race_by_id(db, race_id)
    if not race:
        raise HTTPException(404, "Race not found.")
    if race.status != RaceStatus.pending:
        raise HTTPException(400, f"Race is already '{race.status.value}'. Cannot start.")

    verified = await get_verified_runners(db)
    if not verified:
        raise HTTPException(400, "No verified runners. Upload and verify runners first.")

    return await crud.start_race(db, race)


@router.post("/{race_id}/finish", response_model=RaceSessionRead)
async def finish_race(race_id: str, db: AsyncSession = Depends(get_db)):
    """Finish a race and archive final standings to race_results."""
    race = await crud.get_race_by_id(db, race_id)
    if not race:
        raise HTTPException(404, "Race not found.")
    if race.status != RaceStatus.active:
        raise HTTPException(400, "Race is not active.")

    verified = await get_verified_runners(db)
    # 1. Snapshot and archive final standings to race_results
    race, _ = await crud.finish_race(db, race, verified)

    return race


@router.get("/{race_id}/results", response_model=list[RaceResultRead])
async def get_results(race_id: str, db: AsyncSession = Depends(get_db)):
    """Fetch final standings for a finished race."""
    race = await crud.get_race_by_id(db, race_id)
    if not race:
        raise HTTPException(404, "Race not found.")
    return await crud.get_race_results(db, race_id)


@router.get("/{race_id}/export")
async def export_csv(race_id: str, db: AsyncSession = Depends(get_db)):
    """Download race results as a CSV file."""
    race = await crud.get_race_by_id(db, race_id)
    if not race:
        raise HTTPException(404, "Race not found.")

    results = await crud.get_race_results(db, race_id)

    def fmt_time(dt) -> str:
        return dt.strftime("%H:%M:%S") if dt else "-"

    def fmt_mins(secs) -> str:
        return f"{secs / 60:.1f}" if secs else "-"

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank", "Army Number", "RFID Tag",
        "Start", "Checkpoint 1", "Checkpoint 2", "Finish",
        "Total Time (min)", "Status",
    ])
    for r in results:
        writer.writerow([
            r.rank or "-",
            r.army_number,
            r.rfid_tag,
            fmt_time(r.start_time),
            fmt_time(r.checkpoint1_time),
            fmt_time(r.checkpoint2_time),
            fmt_time(r.finish_time),
            fmt_mins(r.total_time_seconds),
            r.status,
        ])

    output.seek(0)
    race_name = race.custom_name or race.category.value
    filename = f"race_{race_name}_{race.created_at.strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/reset", status_code=status.HTTP_200_OK)
async def reset_active_state(db: AsyncSession = Depends(get_db)):
    """
    Resets the active state for a fresh login session.
    Wipes all transient runners and deletes any 'pending' race sessions in the database.
    """
    from app.models.runner import Runner
    from app.models.race_session import RaceSession, RaceStatus
    from sqlalchemy import delete

    # 1. Wipe transient runners
    await db.execute(delete(Runner))

    # 2. Delete any 'pending' race sessions (leaving finished ones intact)
    await db.execute(delete(RaceSession).where(RaceSession.status == RaceStatus.pending))

    return {"status": "success", "message": "Active state cleanly reset."}
