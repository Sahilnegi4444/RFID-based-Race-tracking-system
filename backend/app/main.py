from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine, Base
from app.routers import runners, checkpoints, verify, races

# Import all models so Alembic/Base can see them
import app.models  # noqa: F401


# ── Lifespan: create tables on startup (dev only) ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


# ── App factory ────────────────────────────────────────────────────────────
app = FastAPI(
    title="RFID Race Tracking API",
    description="Backend for the Indian Army RFID Race Tracking System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS — allow React dev server ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(runners.router,     prefix=API_PREFIX)
app.include_router(checkpoints.router, prefix=API_PREFIX)
app.include_router(verify.router,      prefix=API_PREFIX)
app.include_router(races.router,       prefix=API_PREFIX)


# ── Health check ───────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "env": settings.APP_ENV}
