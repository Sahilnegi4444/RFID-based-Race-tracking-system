import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RaceCategory(str, enum.Enum):
    BPT = "BPT"
    PPT = "PPT"
    CPT = "CPT"
    others = "others"


class RaceStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    finished = "finished"


class RaceSession(Base):
    """
    Represents one race event. Only one race can be active at a time.
    When finished, the results are copied to race_results.
    """

    __tablename__ = "race_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category: Mapped[RaceCategory] = mapped_column(Enum(RaceCategory), nullable=False)

    # Used when category == "others" — admin types a custom name
    custom_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    status: Mapped[RaceStatus] = mapped_column(
        Enum(RaceStatus), default=RaceStatus.pending, nullable=False
    )

    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    def display_name(self) -> str:
        if self.category == RaceCategory.others and self.custom_name:
            return self.custom_name
        return self.category.value

    def __repr__(self) -> str:
        return f"<RaceSession category={self.category} status={self.status}>"
