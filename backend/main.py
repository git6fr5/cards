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


from example_package import register_routes as register_example_routes

register_example_routes(app)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
