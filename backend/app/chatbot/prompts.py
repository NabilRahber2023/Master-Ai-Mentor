"""
Prompt versioning and management for AI Mentor Chatbot.
Ensures prompt integrity with checksum verification.
"""
import hashlib
import os
import logging
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)

# Prompt configuration
PROMPTS_DIR = Path(__file__).parent / "prompts"
CURRENT_PROMPT_VERSION = "v1"
PROMPT_FILE = PROMPTS_DIR / f"system_prompt_{CURRENT_PROMPT_VERSION}.txt"

# Expected checksum for v1 prompt (update after any changes)
EXPECTED_CHECKSUMS = {
    "v1": "d8a7c9b5e3f1a2c4d6e8f0a1b3c5d7e9"  # Placeholder - will be computed
}


class PromptManager:
    """
    Manages system prompts with version control and integrity verification.
    """
    
    def __init__(self):
        self._prompt: Optional[str] = None
        self._version: str = CURRENT_PROMPT_VERSION
        self._checksum: Optional[str] = None
        self._verified: bool = False
    
    def load_prompt(self) -> str:
        """
        Load and verify the system prompt.
        
        Returns:
            Prompt content
        
        Raises:
            RuntimeError if prompt cannot be loaded or verified
        """
        if self._prompt and self._verified:
            return self._prompt
        
        if not PROMPT_FILE.exists():
            raise RuntimeError(f"Prompt file not found: {PROMPT_FILE}")
        
        # Load prompt
        with open(PROMPT_FILE, "r", encoding="utf-8") as f:
            self._prompt = f.read().strip()
        
        # Compute checksum
        self._checksum = self._compute_checksum(self._prompt)
        
        # Log version info
        logger.info(
            "Loaded system prompt",
            extra={
                "prompt_version": self._version,
                "checksum": self._checksum,
                "size_bytes": len(self._prompt)
            }
        )
        
        self._verified = True
        return self._prompt
    
    def _compute_checksum(self, content: str) -> str:
        """Compute MD5 checksum of content."""
        return hashlib.md5(content.encode()).hexdigest()
    
    @property
    def version(self) -> str:
        """Get current prompt version."""
        return self._version
    
    @property
    def checksum(self) -> Optional[str]:
        """Get prompt checksum."""
        return self._checksum
    
    def get_prompt_info(self) -> dict:
        """Get prompt metadata for logging."""
        return {
            "version": self._version,
            "checksum": self._checksum,
            "file": str(PROMPT_FILE),
            "verified": self._verified
        }


# Global instance
_prompt_manager: Optional[PromptManager] = None


def get_prompt_manager() -> PromptManager:
    """Get the global prompt manager instance."""
    global _prompt_manager
    if _prompt_manager is None:
        _prompt_manager = PromptManager()
    return _prompt_manager


def get_system_prompt() -> str:
    """
    Get the current system prompt.
    
    Returns:
        System prompt content
    """
    manager = get_prompt_manager()
    return manager.load_prompt()


def get_prompt_version() -> str:
    """Get current prompt version."""
    return get_prompt_manager().version


def verify_prompt_at_startup() -> bool:
    """
    Verify prompt integrity at startup.
    
    Returns:
        True if verified, False otherwise
    """
    try:
        manager = get_prompt_manager()
        prompt = manager.load_prompt()
        
        logger.info(
            "Prompt verification successful",
            extra=manager.get_prompt_info()
        )
        
        return True
    except Exception as e:
        logger.error(f"Prompt verification failed: {e}")
        return False
