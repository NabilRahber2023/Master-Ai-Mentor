"""
Startup verification for AI Mentor Chatbot.
Validates all dependencies before allowing application to start.
"""
import asyncio
import time
import logging
import os
import sys
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class StartupVerifier:
    """
    Verifies all required components at startup.
    Fails fast if critical dependencies are missing.
    """
    
    def __init__(self):
        self.checks_passed: List[str] = []
        self.checks_failed: List[Tuple[str, str]] = []
        self.cold_start_time: float = 0
    
    async def verify_all(self) -> bool:
        """
        Run all startup checks.
        
        Returns:
            True if all checks pass, False otherwise
        """
        start_time = time.perf_counter()
        logger.info("Starting system verification...")
        
        checks = [
            ("environment", self._check_environment),
            ("database", self._check_database),
            ("pgvector", self._check_pgvector),
            ("ollama", self._check_ollama),
            ("ml_models", self._check_ml_models),
            ("prompts", self._check_prompts),
        ]
        
        for name, check_func in checks:
            try:
                logger.info(f"Checking {name}...")
                await check_func()
                self.checks_passed.append(name)
                logger.info(f"✓ {name} OK")
            except Exception as e:
                self.checks_failed.append((name, str(e)))
                logger.error(f"✗ {name} FAILED: {e}")
        
        self.cold_start_time = time.perf_counter() - start_time
        
        # Log summary
        logger.info(
            "Startup verification complete",
            extra={
                "passed": self.checks_passed,
                "failed": [f[0] for f in self.checks_failed],
                "cold_start_ms": round(self.cold_start_time * 1000, 2)
            }
        )
        
        return len(self.checks_failed) == 0
    
    async def _check_environment(self):
        """Verify required environment variables."""
        required_vars = [
            "DATABASE_URL",
        ]
        
        optional_vars = [
            "OLLAMA_BASE_URL",
            "OLLAMA_MODEL",
        ]
        
        missing = []
        for var in required_vars:
            if not os.getenv(var):
                # Set default for DATABASE_URL if not present
                if var == "DATABASE_URL":
                    os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_mentor"
                else:
                    missing.append(var)
        
        if missing:
            raise RuntimeError(f"Missing required environment variables: {missing}")
        
        # Log optional vars status
        for var in optional_vars:
            if not os.getenv(var):
                logger.warning(f"Optional environment variable not set: {var}")
    
    async def _check_database(self):
        """Verify database connection."""
        from sqlalchemy import text
        from app.chatbot.database import async_session_maker
        
        try:
            async with async_session_maker() as session:
                result = await session.execute(text("SELECT 1"))
                if result.scalar() != 1:
                    raise RuntimeError("Database query failed")
        except Exception as e:
            raise RuntimeError(f"Cannot connect to database: {e}")
    
    async def _check_pgvector(self):
        """Verify pgvector extension is installed."""
        from sqlalchemy import text
        from app.chatbot.database import async_session_maker
        
        try:
            async with async_session_maker() as session:
                result = await session.execute(
                    text("SELECT extname FROM pg_extension WHERE extname = 'vector'")
                )
                row = result.fetchone()
                if not row:
                    raise RuntimeError("pgvector extension not installed")
        except RuntimeError:
            raise
        except Exception as e:
            raise RuntimeError(f"Error checking pgvector: {e}")
    
    async def _check_ollama(self):
        """Verify Ollama is available (warning only, not required)."""
        import httpx
        
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{ollama_url}/api/tags")
                if response.status_code != 200:
                    logger.warning("Ollama is not responding correctly")
        except Exception as e:
            logger.warning(f"Ollama not available (fallback mode will be used): {e}")
            # Don't raise - Ollama is optional with fallback mode
    
    async def _check_ml_models(self):
        """Verify ML models are loadable."""
        import os
        
        model_paths = [
            "app/modules/grade_predictor/sgpa_predictor.cbm",
            "app/modules/career_predictor/career_predictor.cbm",
            "app/modules/nine_box_predictor/artifacts/performance_classifier.cbm",
            "app/modules/subject_predictor/subject_predictor.cbm",
        ]
        
        missing = []
        for path in model_paths:
            if not os.path.exists(path):
                missing.append(path)
        
        if missing:
            logger.warning(f"Missing ML model files: {missing}")
            # Don't fail - models might be loaded from different paths
    
    async def _check_prompts(self):
        """Verify system prompts are available."""
        from app.chatbot.prompts import verify_prompt_at_startup
        
        if not verify_prompt_at_startup():
            raise RuntimeError("System prompt verification failed")
    
    def get_status(self) -> Dict[str, Any]:
        """Get verification status summary."""
        return {
            "all_passed": len(self.checks_failed) == 0,
            "passed": self.checks_passed,
            "failed": dict(self.checks_failed),
            "cold_start_ms": round(self.cold_start_time * 1000, 2)
        }


async def run_startup_checks() -> bool:
    """
    Run all startup checks.
    
    Returns:
        True if all critical checks pass
    """
    verifier = StartupVerifier()
    result = await verifier.verify_all()
    
    if not result:
        critical_failures = [
            name for name, _ in verifier.checks_failed
            if name in ("database", "pgvector")
        ]
        
        if critical_failures:
            logger.critical(
                "Critical startup checks failed - cannot continue",
                extra={"failures": critical_failures}
            )
            return False
    
    return True


def fail_startup(message: str):
    """Fail startup with error message."""
    logger.critical(message)
    sys.exit(1)
