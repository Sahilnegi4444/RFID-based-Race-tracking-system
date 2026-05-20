import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.database import Base
from app.models.runner import Runner
from app.models.race_session import RaceSession
from app.models.race_result import RaceResult
from app.models.checkpoint import CheckpointRecord

async def reset_db():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        from sqlalchemy import text
        await conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
    print("Database cleared.")

if __name__ == "__main__":
    asyncio.run(reset_db())
