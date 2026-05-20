import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ── Race Session ───────────────────────────────────────────────────────────

class RaceSessionCreate(BaseModel):
    category: str           # BPT | PPT | CPT | others
    custom_name: Optional[str] = None   # required when category == "others"


class RaceSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: str
    custom_name: Optional[str]
    status: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    created_at: datetime


# ── Race Result ────────────────────────────────────────────────────────────

class RaceResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    race_session_id: uuid.UUID
    army_number: str
    rfid_tag: str
    start_time: Optional[datetime]
    checkpoint1_time: Optional[datetime]
    checkpoint2_time: Optional[datetime]
    finish_time: Optional[datetime]
    total_time_seconds: Optional[int]
    rank: Optional[int]
    status: str
    created_at: datetime
