import os
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    services_router,
    applications_router,
    officer_router,
    documents_router,
    notifications_router,
    ai_router,
    profile_router,
    admin_router,
    government_auth_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("goveaseai")

app = FastAPI(
    title="GovEaseAI Backend Service",
    description="AI-Powered Government Service Automation Platform API backed by PostgreSQL",
    version="1.0.0"
)

# CORS configuration — explicit origins + dynamic Render onrender.com origin regex
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:3000",
]

extra_origins = os.getenv("CORS_ORIGINS", "") or os.getenv("FRONTEND_URL", "")
if extra_origins:
    for o in extra_origins.split(","):
        clean_o = o.strip().rstrip("/")
        if clean_o and clean_o not in origins:
            origins.append(clean_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error processing {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Health Check
@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    db_status = "unknown"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
            db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "disconnected"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "GovEaseAI Backend",
        "database": db_status,
        "time": datetime.now(timezone.utc).isoformat()
    }

# Include Routers
app.include_router(auth_router)
app.include_router(services_router)
app.include_router(applications_router)
app.include_router(officer_router)
app.include_router(documents_router)
app.include_router(notifications_router)
app.include_router(ai_router)
app.include_router(profile_router)
app.include_router(admin_router)
app.include_router(government_auth_router)

@app.on_event("startup")
def on_startup():
    logger.info("=" * 60)
    logger.info(f"GovEaseAI FastAPI Backend initializing on port {settings.PORT}...")
    try:
        from app.database import SessionLocal
        from app.models.service import GovernmentService
        from app.seed import seed_database

        # 1. Automatically create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL database tables verified/created successfully.")

        # 2. Check if database needs initial seeding
        with SessionLocal() as db:
            svc_count = db.query(GovernmentService).count()
            if svc_count == 0:
                logger.info("Empty database detected. Running initial seed data...")
                seed_database()
            else:
                logger.info(f"Database ready: found {svc_count} active statutory services.")

        with engine.connect() as conn:
            res = conn.execute(text("SELECT current_database();")).scalar()
            logger.info(f"Connected to PostgreSQL database: '{res}'")
    except Exception as e:
        logger.error(f"Database initialization notice: {e}")
    logger.info(f"Active AI Provider: {settings.AI_PROVIDER}")
    logger.info("=" * 60)
