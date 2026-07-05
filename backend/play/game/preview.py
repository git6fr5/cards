from fastapi import APIRouter
from pydantic import BaseModel

from engine.entities.piece import Piece
from engine.loader import load_catalog
from engine.utils.positions import Position

router = APIRouter()


class TokenPreview(BaseModel):
    name: str
    archetype: str
    piece_type: str
    movement: list[list[int]]
    ability: str


class TokenPreviewResponse(BaseModel):
    tokens: list[TokenPreview]


def _movement_grid(movement: set[Position]) -> list[list[int]]:
    """3x3 grid (row 0 = up, col 0 = left) of how many squares a piece
    reaches in each direction; the center is always 0 (self)."""
    grid = [[0] * 3 for _ in range(3)]
    for row in range(3):
        for col in range(3):
            if row == 1 and col == 1:
                continue
            dx, dy = col - 1, 1 - row
            count = 0
            while Position(dx * (count + 1), dy * (count + 1)) in movement:
                count += 1
            grid[row][col] = count
    return grid


@router.get("/tokens/preview", response_model=TokenPreviewResponse)
def preview_tokens() -> TokenPreviewResponse:
    """Every piece in the engine catalog, shaped for the token builder preview."""
    catalog = load_catalog()

    tokens = [
        TokenPreview(
            name=data["name"],
            archetype=data["archetype"],
            piece_type=data["roleType"],
            movement=_movement_grid(Piece.load_movement(data["movement"])),
            ability=data["ability"],
        )
        for data in catalog.values()
    ]

    return TokenPreviewResponse(tokens=tokens)
