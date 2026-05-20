import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CheckpointName(str, enum.Enum):
    start = "start"
    checkpoint1 = "checkpoint1"
    checkpoint2 = "checkpoint2"
    finish = "finish"


class CheckpointRecord(Base):
    """
    One row per RFID read at a gate. The earliest read at each
    checkpoint is the authoritative time for that gate.
    Uses a simple auto-incrementing integer PK — checkpoint records
    are high-volume and never referenced externally by their own ID.
    """

    __tablename__ = "checkpoint_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # FK to Runner — uses army_number (string PK)
    army_number: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("runners.army_number", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    checkpoint: Mapped[CheckpointName] = mapped_column(Enum(CheckpointName), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reader_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Link to the race session this read belongs to
    race_session_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("race_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    runner: Mapped["Runner"] = relationship("Runner", back_populates="checkpoints")

    def __repr__(self) -> str:
        return (
            f"<CheckpointRecord army={self.army_number} "
            f"cp={self.checkpoint} at={self.recorded_at}>"
        )
