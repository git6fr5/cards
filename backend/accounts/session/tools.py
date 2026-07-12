from utils.cacher import increment, get_ttl, set_with_expiry, delete


EMAIL_MAX_ATTEMPTS, EMAIL_WINDOW_SECONDS, EMAIL_LOCKOUT_SECONDS = 5, 15 * 60, 15 * 60
IP_MAX_ATTEMPTS,    IP_WINDOW_SECONDS,    IP_LOCKOUT_SECONDS    = 20, 15 * 60, 15 * 60


def _email_key(email: str) -> str:
    return f"login_throttle:email:{email.strip().lower()}"


def _ip_key(ip: str) -> str:
    return f"login_throttle:ip:{ip}"


def check_login_locked(email: str, ip: str | None) -> tuple[bool, int | None]:
    # IP checked first: cheaper signal, and blunts spraying across many emails from one source.
    if ip is not None:
        ttl = get_ttl(_ip_key(ip) + ":lock")
        if ttl is not None:
            return True, ttl
    ttl = get_ttl(_email_key(email) + ":lock")
    return (True, ttl) if ttl is not None else (False, None)


def record_failed_login(email: str, ip: str | None) -> None:
    _record(_email_key(email), EMAIL_MAX_ATTEMPTS, EMAIL_WINDOW_SECONDS, EMAIL_LOCKOUT_SECONDS)
    if ip is not None:
        _record(_ip_key(ip), IP_MAX_ATTEMPTS, IP_WINDOW_SECONDS, IP_LOCKOUT_SECONDS)


def _record(base_key: str, max_attempts: int, window_seconds: int, lockout_seconds: int) -> None:
    count = increment(base_key + ":fail", expire_seconds=window_seconds)
    if count >= max_attempts:
        set_with_expiry(base_key + ":lock", "1", lockout_seconds)


def clear_login_throttle(email: str) -> None:
    key = _email_key(email)
    delete(key + ":fail", key + ":lock")
