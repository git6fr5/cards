import json
from pathlib import Path

from sqlalchemy.orm import Session

from play.orm.piece import Piece

CATALOG_DIR = Path(__file__).parent.parent / "engine" / ".data" / "catalog"


def seed_piece(session: Session) -> list[Piece]:
    names = {
        json.loads(path.read_text())["name"]
        for path in CATALOG_DIR.glob("**/*.json")
        if not any(part.startswith(".") for part in path.relative_to(CATALOG_DIR).parts)
    }
    pieces = [Piece(name=name) for name in sorted(names)]
    session.add_all(pieces)
    session.flush()
    return pieces
