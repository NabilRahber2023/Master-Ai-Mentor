import os
import time
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import Engines
from app.core.sgpa_ml_engine import sgpa_ml_engine
from app.core.nine_box_ml_engine import nine_box_ml_engine
from app.core.career_ml_engine import career_ml_engine
from app.core.subject_ml_engine import subject_ml_engine

# Import Routers
from app.modules.grade_predictor.router import router as sgpa_router
from app.modules.nine_box_predictor.router import router as nine_box_router
from app.modules.career_predictor.router import router as career_router
from app.modules.subject_predictor.router import router as subject_router
from app.modules.batch_predictor.router import router as batch_router
from app.modules.csv_mode.router import router as csv_mode_router

# Import Chatbot
from app.chatbot import (
    chatbot_router,
    init_db,
    close_db,
    close_llm_client,
    close_tool_executor
)

# Import hardening modules
from app.chatbot.security import SecurityMiddleware
from app.chatbot.startup import run_startup_checks
from app.chatbot.logging_config import setup_logging
from app.chatbot.prompts import verify_prompt_at_startup
from app.chatbot.performance import get_cache_stats

# Setup structured logging
setup_logging("INFO")
logger = logging.getLogger(__name__)

# Track cold start time
_cold_start_time: float = 0


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _cold_start_time
    start_time = time.perf_counter()
    
    logger.info("Starting AI Mentor SaaS Platform...")
    
    # Startup: Load ML Models
    logger.info("Loading ML Models...")
    
    async def load_safe(name, engine, load_method_name=None):
        try:
            logger.info(f"Loading {name}...")
            if load_method_name:
                method = getattr(engine, load_method_name)
                if callable(method):
                     method()
            elif hasattr(engine, "get_model"):
                engine.get_model()
            elif hasattr(engine, "load_model"):
                engine.load_model()
            logger.info(f"{name} loaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to load {name}: {e}")

    await load_safe("SGPA Model", sgpa_ml_engine, "get_model")
    await load_safe("9-Box Model", nine_box_ml_engine)
    await load_safe("Career Model", career_ml_engine, "load_model")
    await load_safe("Subject Model", subject_ml_engine)
    
    # Initialize chatbot database
    try:
        logger.info("Initializing chatbot database...")
        await init_db()
        logger.info("Chatbot database initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize chatbot database: {e}")
    
    # Verify prompts
    verify_prompt_at_startup()
    
    # Run startup checks (non-blocking warnings)
    try:
        await run_startup_checks()
    except Exception as e:
        logger.warning(f"Startup checks incomplete: {e}")
    
    # Log cold start time
    _cold_start_time = time.perf_counter() - start_time
    logger.info(
        "Startup complete",
        extra={"cold_start_ms": round(_cold_start_time * 1000, 2)}
    )
    
    yield
    
    # Shutdown: cleanup
    logger.info("Shutting down...")
    await close_llm_client()
    await close_tool_executor()
    await close_db()
    logger.info("Cleanup complete.")


app = FastAPI(
    title="AI Mentor SaaS Unified API",
    version="2.1.0",
    description="AI-powered student mentoring platform with ML predictions and chatbot",
    lifespan=lifespan
)

# Add security middleware
app.add_middleware(SecurityMiddleware)

# Add CORS middleware. Origins are configurable via the CORS_ALLOW_ORIGINS env var
# (comma-separated). Defaults to local dev hosts. Note: "*" with credentials is
# rejected by browsers, so we use an explicit allow-list instead.
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ALLOW_ORIGINS", _default_origins).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for malformed input
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred"
        }
    )


# Register ML Prediction Routers — each gated by permission + module entitlement.
from fastapi import Depends
from app.auth.deps import require

app.include_router(sgpa_router, prefix="/api/v1/prediction/sgpa",
                   dependencies=[Depends(require("predict:single", module="grade-prediction"))])
app.include_router(nine_box_router, prefix="/api/v1/prediction/9box",
                   dependencies=[Depends(require("predict:single", module="growth-potential"))])
app.include_router(career_router, prefix="/api/v1/prediction/career",
                   dependencies=[Depends(require("predict:single", module="career-guidance"))])
app.include_router(subject_router, prefix="/api/v1/prediction/subject",
                   dependencies=[Depends(require("predict:single", module="subject-prediction"))])
app.include_router(batch_router, prefix="/api/v1/prediction/batch",
                   dependencies=[Depends(require("predict:batch", module="batch-prediction"))])
app.include_router(csv_mode_router, prefix="/api/v1/prediction/csv",
                   dependencies=[Depends(require("predict:single"))])

# Register Chatbot Router
app.include_router(chatbot_router, prefix="/api/v1",
                   dependencies=[Depends(require("chatbot:use", module="ai-chatbot"))])

# Register Admin Router (CSV upload)
from app.chatbot.admin_router import router as admin_router
app.include_router(admin_router, prefix="/api/v1",
                   dependencies=[Depends(require("dataset:upload"))])


@app.get("/api/v1/auth/whoami")
async def whoami(request: Request):
    """Debug: resolve the calling principal from the forwarded session cookie."""
    from app.auth.principal import resolve_principal
    p = await resolve_principal(request)
    if not p:
        return {"authenticated": False}
    return {
        "authenticated": p.is_authenticated, "is_service": p.is_service,
        "user_id": p.user_id, "platform_role": p.platform_role,
        "org_id": p.org_id, "org_role": p.org_role, "modules": sorted(p.modules),
    }


@app.get("/health")
async def health_check():
    health_status = {
        "status": "healthy",
        "cold_start_ms": round(_cold_start_time * 1000, 2),
        "modules": {
            "grade_predictor": {"loaded": False},
            "nine_box_predictor": {"loaded": False},
            "career_predictor": {"loaded": False},
            "subject_predictor": {"loaded": False},
            "chatbot": {"loaded": True}
        },
        "cache": get_cache_stats()
    }
    
    def check_engine(engine, key):
        try:
            is_loaded = False
            if hasattr(engine, "get_model"):
                if engine.get_model() is not None:
                    is_loaded = True
            elif hasattr(engine, "performance_model"):
                if engine.performance_model is not None:
                     is_loaded = True
            elif hasattr(engine, "_model"):
                if getattr(engine, "_model", None) is not None or getattr(engine, "model", None) is not None:
                    is_loaded = True
            
            health_status["modules"][key]["loaded"] = is_loaded
        except:
            health_status["modules"][key]["loaded"] = False
            health_status["status"] = "degraded"

    check_engine(sgpa_ml_engine, "grade_predictor")
    check_engine(nine_box_ml_engine, "nine_box_predictor")
    check_engine(career_ml_engine, "career_predictor")
    check_engine(subject_ml_engine, "subject_predictor")

    return health_status


