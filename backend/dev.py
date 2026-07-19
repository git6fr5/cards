from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from utils.databases import Base, init_engine, dispose_engine

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    test_db = os.getenv("TEST_DB", "false").lower() == "true"
    try:
        engine = init_engine()
        if test_db or os.getenv("DB_AUTO_CREATE", "false").lower() == "true":
            import play.orm  # noqa: F401
            import accounts.orm  # noqa: F401
            Base.metadata.create_all(engine)
        if test_db:
            from fixtures.seed_dev import seed_dev
            seed_dev(engine)
    except Exception as e:
        print(f"[startup] DB connection failed: {e}")

    yield
    dispose_engine()


app = FastAPI(title="App", version="0.1", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health() -> dict:
    return {"message": "Alive"}


from play import router as play_router
from accounts import register_routes as register_accounts_routes

app.include_router(play_router)
register_accounts_routes(app)
