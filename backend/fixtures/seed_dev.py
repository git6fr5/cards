import time

from sqlalchemy import select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from accounts.orm.organisation import Organisation
from fixtures.seed_piece import seed_piece
from fixtures.seed_organisation import seed_organisation
from fixtures.seed_user import seed_user, seed_password
from fixtures.seed_player import seed_player
from fixtures.seed_bag import seed_bag
from fixtures.seed_friend import seed_friend
from fixtures.seed_game import seed_game


def seed_dev(engine: Engine) -> dict[str, int]:
    started = time.perf_counter()
    with Session(engine, expire_on_commit=False) as session:
        if session.execute(select(Organisation.id).limit(1)).first() is not None:
            print("Dev database already seeded — skipping")
            return {"skipped": 1}
        print("Seeding dev database")
        print("  piece")
        pieces = seed_piece(session)
        print("  organisation")
        organisation = seed_organisation(session)
        print("  user")
        users = seed_user(session, organisation)
        print("  player")
        players = seed_player(session, users)
        print("  bag")
        bags = seed_bag(session, players, pieces)
        print("  friend")
        seed_friend(session, players)
        print("  game")
        games = seed_game(session, players, bags)
        session.commit()

    elapsed = time.perf_counter() - started
    print(f"Seeded dev database in {elapsed:.1f}s")
    print("Player logins:")
    password = seed_password()
    for user in users:
        print(f"  {user.email} / {password}")

    return {
        "piece": len(pieces),
        "organisation": 1,
        "user": len(users),
        "player": len(players),
        "bag": len(bags),
        "friend": 1,
        "game": len(games),
    }


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    from utils.databases import init_engine
    seed_dev(init_engine())
