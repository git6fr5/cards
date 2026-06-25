from contextvars import ContextVar
from functools import wraps
from sqlalchemy.orm import Session, DeclarativeBase
from sqlalchemy import text
from typing import Type, TypeVar, Optional, Any
from sqlalchemy.orm import Query


class Base(DeclarativeBase):
    pass

current_session: ContextVar[Session] = ContextVar('session')
current_session_readonly: ContextVar[bool] = ContextVar('session_readonly', default=False)
T = TypeVar('T')


class DatabaseConnection:

    @staticmethod
    def _assert_writable():
        if current_session_readonly.get():
            raise RuntimeError("Cannot write in a read-only session")

    @staticmethod
    def add(instance: object) -> None:
        DatabaseConnection._assert_writable()
        return current_session.get().add(instance)

    @staticmethod
    def delete(instance: object) -> None:
        DatabaseConnection._assert_writable()
        return current_session.get().delete(instance)

    @staticmethod
    def query(entity: Type[T]) -> Query[T]:
        return current_session.get().query(entity)

    @staticmethod
    def get(entity: Type[T], ident: Any, **kwargs) -> Optional[T]:
        return current_session.get().get(entity, ident, **kwargs)

    @staticmethod
    def commit() -> None:
        DatabaseConnection._assert_writable()
        return current_session.get().commit()

    @staticmethod
    def refresh(instance: object, **kwargs) -> None:
        return current_session.get().refresh(instance, **kwargs)

    @staticmethod
    def flush(**kwargs) -> None:
        DatabaseConnection._assert_writable()
        return current_session.get().flush(**kwargs)

    @staticmethod
    def rollback() -> None:
        DatabaseConnection._assert_writable()
        return current_session.get().rollback()

    @staticmethod
    def execute(statement: Any, **kwargs) -> Any:
        return current_session.get().execute(statement, **kwargs)


def _read_session(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        from main import engine
        with Session(engine) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(True)
            try:
                return func(*args, **kwargs)
            finally:
                current_session.reset(token)
                current_session_readonly.reset(ro_token)
    return wrapper


def _write_session(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        from main import engine
        with Session(engine, expire_on_commit=False) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(False)
            try:
                result = func(*args, **kwargs)
                session.commit()
                return result
            except Exception:
                session.rollback()
                raise
            finally:
                current_session.reset(token)
                current_session_readonly.reset(ro_token)
    return wrapper


def _creation_session(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        from main import engine
        with Session(engine, expire_on_commit=False) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(False)
            try:
                resource = func(*args, **kwargs)
                DatabaseConnection.add(resource)
                DatabaseConnection.flush()
                DatabaseConnection.refresh(resource)
                session.commit()
                return resource
            except Exception:
                session.rollback()
                raise
            finally:
                current_session.reset(token)
                current_session_readonly.reset(ro_token)
    return wrapper

create_resource = _creation_session
read_resource = _read_session
update_resource = _write_session
delete_resource = _write_session