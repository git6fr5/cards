import json
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import Engine, select
from engine.orm.token_definition import TokenDefinition

_DATA_DIR = Path(__file__).parents[2] / "frontend" / "data"


def seed_tokens(engine: Engine) -> None:
    files = [_DATA_DIR / "dragons.json", _DATA_DIR / "goblins.json"]
    with Session(engine) as session:
        for filepath in files:
            if not filepath.exists():
                print(f"[seed] skipping missing file: {filepath}")
                continue
            raw_list: list[dict] = json.loads(filepath.read_text())
            for raw in raw_list:
                existing = session.execute(
                    select(TokenDefinition).where(TokenDefinition.name == raw["name"])
                ).scalar_one_or_none()
                if existing:
                    continue
                row = TokenDefinition(
                    name        = raw["name"],
                    archetype   = raw["archetype"],
                    piece_type  = raw["pieceType"],
                    body_color  = raw["bodyColor"],
                    movement    = raw["movement"],
                    effect_grid = raw["effect"],
                    effect_dsl  = None,
                    summon_cost = raw.get("summonCost", 1),
                    move_cost   = raw.get("moveCost", 1),
                )
                session.add(row)
                print(f"[seed] added token: {raw['name']}")
        session.commit()
    print("[seed] done")
