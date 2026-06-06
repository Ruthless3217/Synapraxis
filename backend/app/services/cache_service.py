import os
import json
import logging

logger = logging.getLogger(__name__)

# Try importing redis
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.in_memory_cache = {}
        
        if REDIS_AVAILABLE:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            try:
                # Set a socket timeout so it fails fast if Redis isn't running
                self.redis_client = redis.from_url(redis_url, socket_timeout=1.0, decode_responses=True)
                # Test connection
                self.redis_client.ping()
                logger.info(f"Connected to Redis cache at {redis_url}")
            except Exception as e:
                logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory cache.")
                self.redis_client = None
        else:
            logger.info("Redis package not installed. Using in-memory cache.")

    def get(self, key: str) -> dict | None:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.error(f"Redis get error: {e}")
        
        return self.in_memory_cache.get(key)

    def set(self, key: str, value: dict, expire_seconds: int = 86400):
        if self.redis_client:
            try:
                self.redis_client.set(key, json.dumps(value), ex=expire_seconds)
                return
            except Exception as e:
                logger.error(f"Redis set error: {e}")
                
        self.in_memory_cache[key] = value

cache_service = CacheService()
