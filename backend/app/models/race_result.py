import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, PrimaryKeyConstraint, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RaceResult(Base):
    """
    Final standings snapshot taken when a race session is finished.
    Immutable archive — one row per runner per race.
    Composite PK (army_number + race_session_id) enforces this constraint
    naturally — no separate ID column needed.
    """

    __tablename__ = "race_results"
    __table_args__ = (
        PrimaryKeyConstraint("army_number", "race_session_id"),
    )

    army_number: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )
    race_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("race_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rfid_tag: Mapped[str] = mapped_column(String(64), nullable=False)

    # Checkpoint timestamps (nullable — runner may not reach all gates)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    checkpoint1_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    checkpoint2_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    finish_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    total_time_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="registered", nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<RaceResult army={self.army_number} rank={self.rank} "
            f"total={self.total_time_seconds}s>"
        )
