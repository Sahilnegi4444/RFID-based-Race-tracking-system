from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class RunnerCreate(BaseModel):
    rfid_tag: str
    army_number: str
    verified: bool = False


class RunnerBulkCreate(BaseModel):
    runners: list[RunnerCreate]


class RunnerStatusUpdate(BaseModel):
    status: str


from app.schemas.checkpoint import CheckpointRecordRead


class RunnerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    army_number: str
    rfid_tag: str
    verified: bool
    verified_at: Optional[datetime]
    status: str
    created_at: datetime
    updated_at: datetime
    checkpoints: list[CheckpointRecordRead] = []


class VerifyResponse(BaseModel):
    army_number: str
    verified: bool
    message: str
    verified_at: Optional[datetime] = None
