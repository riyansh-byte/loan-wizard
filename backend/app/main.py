from dotenv import load_dotenv
load_dotenv()  # Must be first

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.routers import session, offer, webhook, audit, dashboard, auth
from infra.create_tables import create_tables

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("loan-wizard")

# -------------------------
# App Init
# -------------------------
app = FastAPI(
    title="Loan Wizard API",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    try:
        create_tables()
        logger.info("DynamoDB tables verified")
    except Exception as exc:
        logger.warning(f"Table creation warning: {exc}")

logger.info("Loan Wizard API started")

# -------------------------
# Middleware
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"]
)

# -------------------------
# Global Error Handler
# -------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
       content={ "error": str(exc), 
        "type": type(exc).__name__}
    )

# -------------------------
# Health Check
# -------------------------
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "loan-wizard-api",
        "version": "1.0.0"
    }

# -------------------------
# Routers
# -------------------------
app.include_router(session.router, prefix="/api/v1/session", tags=["session"])
app.include_router(offer.router, prefix="/api/v1/offer", tags=["offer"])
app.include_router(webhook.router, prefix="/api/v1/webhook", tags=["webhook"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
