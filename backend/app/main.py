import os
import time
import logging
from contextlib import asynccontextmanager
from typing import Callable
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine
from app.db.init_db import init_db
from app.routes.api import api_router
from app.utils.logger import setup_logging, get_logger
from app.utils.exceptions import CloudCartException

# Initialize structured logging
setup_logging()
logger = get_logger("cloudcart.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Initializes database schema, verifies connection, and runs initial seeding.
    """
    logger.info("Initializing CloudCart application and database engine...")
    try:
        init_db()
        logger.info("Database schema verified and initial catalog data ready.")
    except Exception as exc:
        logger.error(f"Error initializing database during startup: {exc}", exc_info=True)
    yield
    logger.info("CloudCart application is safely shutting down.")


tags_metadata = [
    {"name": "General", "description": "System status, health checks and service information."},
    {"name": "Authentication", "description": "JWT-based customer and admin authentication & profile endpoints."},
    {"name": "Products", "description": "Catalog browsing, searching, category filtering, and product CRUD."},
    {"name": "Categories", "description": "Electronics department hierarchy and category metadata."},
    {"name": "Cart", "description": "Session-backed user shopping cart and quantity management."},
    {"name": "Orders", "description": "Fulfillment tracking, checkout processing, and status management."},
    {"name": "Users", "description": "User account management and administrator operations."},
    {"name": "Addresses", "description": "Customer shipping and billing address management."},
    {"name": "Wishlist", "description": "Customer saved items and favorite products."},
    {"name": "Reviews", "description": "Product ratings and verified customer reviews."},
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "**CloudCart Enterprise E-Commerce API**\n\n"
        "High-performance REST API built with FastAPI, SQLAlchemy 2.0, PostgreSQL, "
        "Pydantic v2, PyJWT, and Passlib bcrypt.\n\n"
        "Features:\n"
        "- 🔐 Secure JWT Bearer Authentication with Role-Based Access Control (Admin / Customer)\n"
        "- 📦 Comprehensive Hardware Catalog with Departments, SKU Tracking, and Search\n"
        "- 🛒 Persistent Shopping Cart and Inventory-Validated Order Fulfillment\n"
        "- ⚡ Real-Time Health Checks, Dynamic CORS, and Structured Error Responses"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
)

# Configure CORS Middleware for Frontend Integration & Network Hosting
origins = settings.BACKEND_CORS_ORIGINS or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dedicated local uploads storage for product images (No AWS S3)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "products"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# --- Request Timing & Logging Middleware ---
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next: Callable):
    start_time = time.perf_counter()
    response = None
    try:
        response = await call_next(request)
        process_time = (time.perf_counter() - start_time) * 1000
        logger.info(
            f"{request.method} {request.url.path} - {response.status_code} ({process_time:.2f}ms)"
        )
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response
    except Exception as exc:
        process_time = (time.perf_counter() - start_time) * 1000
        logger.error(
            f"{request.method} {request.url.path} failed with unhandled exception ({process_time:.2f}ms): {exc}",
            exc_info=True,
        )
        raise exc


# --- Custom Exception Handlers ---
@app.exception_handler(CloudCartException)
async def cloudcart_exception_handler(request: Request, exc: CloudCartException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
            },
        },
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = []
    for error in exc.errors():
        field = ".".join([str(loc) for loc in error.get("loc", []) if loc != "body"])
        formatted_errors.append({
            "field": field or "body",
            "message": error.get("msg", "Invalid value"),
            "type": error.get("type", "value_error"),
        })

    logger.warning(f"Validation error on {request.method} {request.url.path}: {formatted_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed. Please check the supplied parameters.",
                "details": formatted_errors,
            },
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.critical(f"Unhandled system error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred on the server. Please try again later.",
            },
        },
    )


# --- Core API Router ---
app.include_router(api_router, prefix=settings.API_V1_STR)


# --- Health Check Endpoints ---
@app.get("/", tags=["General"])
def root():
    """Service metadata and links to OpenAPI documentation."""
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_v1": settings.API_V1_STR,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health", tags=["General"])
def health_check():
    """
    Lightweight health check endpoint for monitoring probes.
    """
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)[:60]}"

    is_healthy = "unhealthy" not in db_status
    return JSONResponse(
        status_code=status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "service": settings.PROJECT_NAME,
            "version": "1.0.0",
            "database": db_status,
            "dialect": engine.dialect.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.get(f"{settings.API_V1_STR}/health", tags=["General"])
def api_v1_health_check():
    """
    API v1 health and system diagnostics endpoint.
    """
    return health_check()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
