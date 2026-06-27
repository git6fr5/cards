import csv
from pathlib import Path

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

import game
from game.orm.token_definition import TokenDefinition

router = APIRouter(prefix="/sets", tags=["Sets"])

_SETS_DIR = Path(__file__).parent / "sets" / "default"


def _token_def_to_dict(td: TokenDefinition) -> dict:
    return {
        "id":          td.id,
        "name":        td.name,
        "archetype":   td.archetype,
        "piece_type":  td.piece_type,
        "body_color":  td.body_color,
        "movement":    td.movement,
        "effect_grid": td.effect_grid,
        "effect_dsl":  td.effect_dsl,
        "summon_cost": td.summon_cost,
        "move_cost":   td.move_cost,
    }


@router.get("/tokens")
def list_tokens() -> dict:
    """Returns every TokenDefinition in the database (for the token builder)."""
    with Session(game.sqlite_engine) as session:
        rows = session.execute(select(TokenDefinition)).scalars().all()
        return {"tokens": [_token_def_to_dict(td) for td in rows]}


@router.get("/default/{archetype}")
def get_default_set(archetype: str) -> dict:
    csv_path = _SETS_DIR / f"{archetype.lower()}.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"No default set for archetype '{archetype}'")

    with csv_path.open(newline="") as f:
        names = [row[0].strip() for row in csv.reader(f) if row and row[0].strip()]

    with Session(game.sqlite_engine) as session:
        tokens = []
        for name in names:
            td = session.execute(
                select(TokenDefinition).where(TokenDefinition.name == name)
            ).scalar_one_or_none()
            if td is None:
                raise HTTPException(status_code=404, detail=f"Token '{name}' not found in database")
            tokens.append(_token_def_to_dict(td))

    return {"tokens": tokens}
