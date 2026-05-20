import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CheckpointRecordCreate(BaseModel):
    rfid_tag: str
    checkpoint: str       # "start" | "checkpoint1" | "checkpoint2" | "finish"
    recorded_at: datetime
    reader_id: Optional[str] = None
    race_session_id: Optional[uuid.UUID] = None  # must be UUID, not str


class CheckpointRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    army_number: str
    checkpoint: str
    recorded_at: datetime
    reader_id: Optional[str]
    race_session_id: Optional[str]  # UUID of the race session, kept as str
    created_at: datetime
