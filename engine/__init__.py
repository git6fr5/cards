# sqlite_engine is set by main.py lifespan.
# Other submodules reference it as:  import game; game.sqlite_engine
sqlite_engine = None


def register_routes(app) -> None:
    from game.routes import router
    from game.sets_routes import router as sets_router
    app.include_router(router)
    app.include_router(sets_router)


__all__ = ["register_routes", "sqlite_engine"]
