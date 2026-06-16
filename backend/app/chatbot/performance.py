"""
Performance utilities for AI Mentor Chatbot.
LRU caching, timeouts, and connection pooling.
"""
import asyncio
import hashlib
import time
from functools import lru_cache, wraps
from typing import Any, Callable, Dict, Optional, TypeVar
from cachetools import TTLCache
import logging

logger = logging.getLogger(__name__)

# Type variable for generic functions
T = TypeVar('T')

# Configuration
DEFAULT_TIMEOUT_SECONDS = 10.0
DB_TIMEOUT_SECONDS = 2.0
LLM_TIMEOUT_SECONDS = 10.0
CACHE_TTL_SECONDS = 300  # 5 minutes
CACHE_MAX_SIZE = 1000


class AsyncTimeoutError(Exception):
    """Raised when async operation times out."""
    pass


def async_timeout(seconds: float = DEFAULT_TIMEOUT_SECONDS):
    """
    Decorator to add timeout to async functions.
    
    Args:
        seconds: Timeout in seconds
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=seconds
                )
            except asyncio.TimeoutError:
                logger.warning(
                    f"Operation timed out after {seconds}s",
                    extra={
                        "function": func.__name__,
                        "timeout_seconds": seconds
                    }
                )
                raise AsyncTimeoutError(
                    f"Operation '{func.__name__}' timed out after {seconds} seconds"
                )
        return wrapper
    return decorator


class AsyncTTLCache:
    """
    Thread-safe TTL cache for async operations.
    Used for caching student lookups and embeddings.
    """
    
    def __init__(
        self,
        maxsize: int = CACHE_MAX_SIZE,
        ttl: int = CACHE_TTL_SECONDS
    ):
        self._cache = TTLCache(maxsize=maxsize, ttl=ttl)
        self._lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        async with self._lock:
            value = self._cache.get(key)
            if value is not None:
                self._hits += 1
            else:
                self._misses += 1
            return value
    
    async def set(self, key: str, value: Any) -> None:
        """Set value in cache."""
        async with self._lock:
            self._cache[key] = value
    
    async def delete(self, key: str) -> None:
        """Delete value from cache."""
        async with self._lock:
            self._cache.pop(key, None)
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        async with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
    
    def stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "hits": self._hits,
            "misses": self._misses,
            "size": len(self._cache),
            "hit_rate_percent": round(hit_rate, 2)
        }


# Global cache instances
_student_cache: Optional[AsyncTTLCache] = None
_embedding_cache: Optional[AsyncTTLCache] = None


def get_student_cache() -> AsyncTTLCache:
    """Get the global student cache."""
    global _student_cache
    if _student_cache is None:
        _student_cache = AsyncTTLCache(maxsize=500, ttl=300)
    return _student_cache


def get_embedding_cache() -> AsyncTTLCache:
    """Get the global embedding cache."""
    global _embedding_cache
    if _embedding_cache is None:
        _embedding_cache = AsyncTTLCache(maxsize=200, ttl=600)
    return _embedding_cache


def cache_key(*args, **kwargs) -> str:
    """Generate consistent cache key from arguments."""
    key_parts = [str(arg) for arg in args]
    key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    key_string = "|".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached_student_lookup(func: Callable) -> Callable:
    """
    Decorator for caching student lookups.
    """
    @wraps(func)
    async def wrapper(self, student_id: str, *args, **kwargs):
        cache = get_student_cache()
        cache_k = cache_key("student", student_id)
        
        # Try cache first
        cached = await cache.get(cache_k)
        if cached is not None:
            logger.debug(f"Cache hit for student {student_id}")
            return cached
        
        # Call original function
        result = await func(self, student_id, *args, **kwargs)
        
        # Cache successful results
        if result[0]:  # success=True
            await cache.set(cache_k, result)
        
        return result
    
    return wrapper


def cached_embedding(func: Callable) -> Callable:
    """
    Decorator for caching embedding generation.
    """
    @wraps(func)
    def wrapper(texts, *args, **kwargs):
        # Only cache single text lookups
        if isinstance(texts, list) and len(texts) == 1:
            cache = get_embedding_cache()
            text = texts[0]
            cache_k = cache_key("embedding", text[:100])
            
            # Sync cache check (embedding is sync function)
            cached = cache._cache.get(cache_k)
            if cached is not None:
                return [cached]
        
        # Call original function
        result = func(texts, *args, **kwargs)
        
        # Cache result
        if isinstance(texts, list) and len(texts) == 1:
            cache._cache[cache_k] = result[0]
        
        return result
    
    return wrapper


class PerformanceMonitor:
    """Monitor and log performance metrics."""
    
    def __init__(self, name: str):
        self.name = name
        self.start_time: float = 0
        self._timings: list = []
    
    def __enter__(self):
        self.start_time = time.perf_counter()
        return self
    
    def __exit__(self, *args):
        elapsed = (time.perf_counter() - self.start_time) * 1000
        self._timings.append(elapsed)
        
        if elapsed > 1000:  # Log slow operations (>1s)
            logger.warning(
                f"Slow operation: {self.name}",
                extra={
                    "operation": self.name,
                    "latency_ms": round(elapsed, 2)
                }
            )
    
    @property
    def avg_latency(self) -> float:
        """Average latency in ms."""
        if not self._timings:
            return 0
        return sum(self._timings) / len(self._timings)


def get_cache_stats() -> Dict[str, Any]:
    """Get statistics for all caches."""
    return {
        "student_cache": get_student_cache().stats(),
        "embedding_cache": get_embedding_cache().stats()
    }
