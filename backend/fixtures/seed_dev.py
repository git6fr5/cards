import time

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from play.orm.piece import Piece
from fixtures.piece import seed_piece


def seed_dev(engine: Engine) -> dict[str, int]:
    started = time.perf_counter()
    with Session(engine, expire_on_commit=False) as session:
        if session.execute(select(Piece.id).limit(1)).first() is not None:
            print("Dev database already seeded — skipping")
            return {"skipped": 1}
        print("Seeding dev database")
        print("  piece")
        pieces = seed_piece(session)
        session.commit()
    elapsed = time.perf_counter() - started
    print(f"Seeded dev database in {elapsed:.1f}s")
    return {"piece": len(pieces)}


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    from utils.databases import init_engine
    seed_dev(init_engine())
