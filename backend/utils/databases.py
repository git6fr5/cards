import os
from contextvars import ContextVar
from functools import wraps
from sqlalchemy.orm import Session, DeclarativeBase
from sqlalchemy import create_engine, inspect as sa_inspect, text
from sqlalchemy.engine import Engine
from typing import Type, TypeVar, Optional, Any
from sqlalchemy.orm import Query


class Base(DeclarativeBase):
    pass

current_session: ContextVar[Session] = ContextVar('session')
current_session_readonly: ContextVar[bool] = ContextVar('session_readonly', default=False)
T = TypeVar('T')


engine: Engine | None = None
_test_container: Any = None


def init_engine() -> Engine:
    global engine, _test_container
    if engine is None:
        if os.getenv("TEST_DB", "false").lower() == "true":
            from testcontainers.postgres import PostgresContainer
            _test_container = PostgresContainer("pgvector/pgvector:pg16").start()
            database_url = _test_container.get_connection_url()
        else:
            database_url = os.getenv("DATABASE_URL")
        engine = create_engine(
            database_url,
            echo=os.getenv("DEBUG_DATABASE", "false").lower() == "true",
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10},
        )
        if _test_container is not None:
            with engine.begin() as connection:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    return engine


def dispose_engine() -> None:
    global engine, _test_container
    if os.getenv("TEST_DB", "false").lower() != "true":
        return
    if engine is not None:
        engine.dispose()
        engine = None
    if _test_container is not None:
        _test_container.stop()
        _test_container = None


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

    @staticmethod
    def session() -> Session:
        return current_session.get()


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


def _read_session_async(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        with Session(init_engine()) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(True)
            try:
                return await func(*args, **kwargs)
            finally:
                current_session.reset(token)
                current_session_readonly.reset(ro_token)
    return wrapper


def _write_session_async(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        with Session(init_engine(), expire_on_commit=False) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(False)
            try:
                result = await func(*args, **kwargs)
                session.commit()
                return result
            except Exception:
                session.rollback()
                raise
            finally:
                current_session.reset(token)
                current_session_readonly.reset(ro_token)
    return wrapper


def _creation_session_async(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        with Session(init_engine(), expire_on_commit=False) as session:
            token = current_session.set(session)
            ro_token = current_session_readonly.set(False)
            try:
                resource = await func(*args, **kwargs)
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

create_resource_async = _creation_session_async
read_resource_async = _read_session_async
update_resource_async = _write_session_async
delete_resource_async = _write_session_async