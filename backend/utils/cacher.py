import os

import redis


_client: redis.Redis | None = None

#aasdsada
def _get_client() -> redis.Redis:
    global _client
    if _client is None:
        rest_url = os.environ["UPSTASH_REDIS_REST_URL"]
        token = os.environ["UPSTASH_REDIS_REST_TOKEN"]
        host = rest_url.removeprefix("https://").removeprefix("http://").rstrip("/")
        _client = redis.Redis.from_url(f"rediss://default:{token}@{host}:6379")
    return _client


def increment(key: str, expire_seconds: int | None = None) -> int:
    # Arms the expiry only on the first increment, i.e. a fixed window starting
    # from the first call for a given key rather than a rolling window.
    count = _get_client().incr(key)
    if count == 1 and expire_seconds is not None:
        _get_client().expire(key, expire_seconds)
    return count


def get_ttl(key: str) -> int | None:
    ttl = _get_client().ttl(key)
    return ttl if ttl and ttl > 0 else None


def set_with_expiry(key: str, value: str, expire_seconds: int) -> None:
    _get_client().set(key, value, ex=expire_seconds)


def delete(*keys: str) -> None:
    if keys:
        _get_client().delete(*keys)
