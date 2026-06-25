from fastapi import FastAPI

from example_package.example_items import router as example_items_router


def register_routes(app: FastAPI) -> None:
    app.include_router(example_items_router)


__all__ = ["register_routes"]
