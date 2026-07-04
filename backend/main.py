from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from utils.databases import Base, init_engine

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from play.orm import Game, GamePlayer, GameLog  # noqa: F401
        Base.metadata.create_all(init_engine())
    except Exception as e:
        print(f"[startup] DB connection failed: {e}")

    yield


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

app.include_router(play_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
