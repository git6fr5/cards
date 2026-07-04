import os
from contextvars import ContextVar
from functools import wraps
from sqlalchemy.orm import Session, DeclarativeBase
from sqlalchemy import create_engine, inspect as sa_inspect
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool
from typing import Type, TypeVar, Optional, Any
from sqlalchemy.orm import Query


class Base(DeclarativeBase):
    pass

current_session: ContextVar[Session] = ContextVar('session')
current_session_readonly: ContextVar[bool] = ContextVar('session_readonly', default=False)
T = TypeVar('T')


engine: Engine | None = None


def init_engine() -> Engine:
    global engine
    if engine is None:
        url = os.getenv("DATABASE_URL")
        echo = os.getenv("DEBUG_DATABASE", "false").lower() == "true"

        if url.startswith("sqlite"):
            # StaticPool keeps one shared connection alive for the engine's
            # lifetime — required for sqlite:///:memory: (each new connection
            # otherwise gets its own separate, empty in-memory database).
            engine = create_engine(
                url,
                echo=echo,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        else:
            engine = create_engine(
                url,
                echo=echo,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 10},
            )
    return engine


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
        with Session(init_engine()) as session:
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
        with Session(init_engine(), expire_on_commit=False) as session:
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
        with Session(init_engine(), expire_on_commit=False) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(False)
            try:
                resource = func(*args, **kwargs)
                DatabaseConnection.add(resource)
                DatabaseConnection.flush()
                col_attrs = [c.key for c in sa_inspect(type(resource)).mapper.column_attrs]
                DatabaseConnection.refresh(resource, attribute_names=col_attrs)
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