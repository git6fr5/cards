import functools
import os
import time

import psutil
from termcolor import colored

DEBUG_ENABLED = os.getenv("DEBUG_ENABLED", "false").lower() == "true"


def debug_pretty(i="yellow", o="red"):
    def decorator(func):
        if not DEBUG_ENABLED:
            return func

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(colored(f"[{func.__name__}]\ncalled with {args, kwargs}", i))
            result = func(*args, **kwargs)
            print(colored(f"[{func.__name__}]\nreturned -> {result}\n", o))
            return result
        return wrapper
    return decorator


def debug_timer(color="magenta"):
    def decorator(func):
        if not DEBUG_ENABLED:
            return func

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            print(colored(f"{func.__qualname__} started", color), flush=True)
            start = time.perf_counter()
            result = func(*args, **kwargs)
            print(colored(f"{func.__qualname__} {(time.perf_counter()-start)*1000:.2f}ms", color), flush=True)
            return result
        return wrapper
    return decorator


def debug_memory(color="green"):
    def decorator(func):
        if not DEBUG_ENABLED:
            return func

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            proc = psutil.Process()
            before = proc.memory_info().rss / 1024 ** 2
            print(colored(f"{func.__qualname__} mem before: {before:.1f}MB", color), flush=True)
            result = func(*args, **kwargs)
            after = proc.memory_info().rss / 1024 ** 2
            print(colored(f"{func.__qualname__} mem after: {after:.1f}MB ({after-before:+.1f}MB)", color), flush=True)
            return result
        return wrapper
    return decorator


prettybug = debug_pretty
timerbug = debug_timer
membug = debug_memory
