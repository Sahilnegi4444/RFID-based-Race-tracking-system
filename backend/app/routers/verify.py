import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.crud.runner import get_runner_by_army_number, mark_verified
from app.database import get_db
from app.schemas.runner import VerifyResponse

router = APIRouter(prefix="/verify", tags=["verification"])


@router.get("/{army_number}", response_model=VerifyResponse)
async def verify_army_number(
    army_number: str, db: AsyncSession = Depends(get_db)
):
    """
    Verify whether an army number is authorized to race today.

    Production: calls the real internal Army server at settings.VERIFICATION_SERVER_URL.
    Development/mock: always returns verified=True after a short simulated delay.
    """

    # ── Production path (swap in when real server is available) ───────────
    # if settings.VERIFICATION_SERVER_URL:
    #     async with httpx.AsyncClient() as client:
    #         resp = await client.get(
    #             f"{settings.VERIFICATION_SERVER_URL}/check/{army_number}",
    #             timeout=5.0,
    #         )
    #         data = resp.json()
    #         is_verified = data.get("authorized", False)
    #         msg = data.get("message", "")
    # else:

    # ── Mock path (used until real server is configured) ──────────────────
    await asyncio.sleep(0.15)   # simulate network latency
    is_verified = True           # replace with real logic when server is ready
    msg = "Authorized for today's race (mock)"

    # If runner exists in DB, stamp the verification
    runner = await get_runner_by_army_number(db, army_number)
    verified_at = None
    if runner and is_verified:
        runner = await mark_verified(db, runner)
        verified_at = runner.verified_at

    return VerifyResponse(
        army_number=army_number,
        verified=is_verified,
        message=msg,
        verified_at=verified_at,
    )
