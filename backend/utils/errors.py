# Test change
from fastapi import HTTPException


def assert_preconditions(checks: list[tuple[bool, int, str]], errors: dict):
    for condition, code, error in checks:
        if condition:
            raise HTTPException(status_code=code, detail=errors[error])


def runtime_conditions(checks: list[tuple[bool, str]], errors: dict):
    for condition, error in checks:
        if condition:
            raise RuntimeError(errors[error])
