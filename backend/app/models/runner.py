import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RunnerStatus(str, enum.Enum):
    registered = "registered"
    running = "running"
    finished = "finished"
    disqualified = "disqualified"


class Runner(Base):
    """
    Race participant identified by their Indian Army service number.
    army_number is the primary key — it uniquely identifies a person
    even if their RFID tag is replaced.
    """

    __tablename__ = "runners"

    army_number: Mapped[str] = mapped_column(String(32), primary_key=True)
    rfid_tag: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    # Verification against internal Army server
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[RunnerStatus] = mapped_column(
        Enum(RunnerStatus), default=RunnerStatus.registered, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    checkpoints: Mapped[list["CheckpointRecord"]] = relationship(
        "CheckpointRecord", back_populates="runner", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Runner army={self.army_number} rfid={self.rfid_tag} verified={self.verified}>"
