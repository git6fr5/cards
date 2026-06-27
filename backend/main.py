from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from dotenv import load_dotenv
from utils.databases import Base

load_dotenv()

engine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    try:
        engine = create_engine(
            os.getenv("DATABASE_URL"),
            echo=os.getenv("DEBUG_DATABASE", "false").lower() == "true",
            pool_pre_ping=True,
            connect_args={"connect_timeout": 10},
        )
        from example_package.orm import ExampleItem  # noqa: F401
        Base.metadata.create_all(engine)
    except Exception as e:
        print(f"[startup] DB connection failed: {e}")

    # SQLite game engine — spun up for the lifecycle of this process only
    from sqlalchemy import create_engine as _ce
    from game.orm import GameBase, TokenDefinition, GameSnapshot  # noqa: F401
    from game.seed import seed_tokens
    from game.context import init_room_0
    import game as _game

    sqlite_engine = _ce(
        "sqlite:///./game.db",
        echo=False,
        connect_args={"check_same_thread": False},
    )
    GameBase.metadata.create_all(sqlite_engine)
    _game.sqlite_engine = sqlite_engine
    seed_tokens(sqlite_engine)
    init_room_0()

    yield

    sqlite_engine.dispose()
    try:
        os.remove("./game.db")
    except FileNotFoundError:
        pass


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


from example_package import register_routes as register_example_routes
from game import register_routes as register_game_routes

register_example_routes(app)
register_game_routes(app)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
