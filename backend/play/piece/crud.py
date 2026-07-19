from fastapi import APIRouter, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from play.orm.piece import Piece
from play.piece.tools import resolve_catalog_entries
from utils.databases import read_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "piece_not_found": "The requested piece does not exist.",
}


class PieceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:   int
    name: str


class PieceAttributesResponse(BaseModel):
    summon_cost: int
    action_cost: int
    action_count: int


class PieceFullResponse(BaseModel):
    id:         int
    name:       str
    archetype:  str
    role_type:  str
    movement:   str
    ability:    str
    attributes: PieceAttributesResponse


@router.get("", response_model=list[PieceResponse])
@read_resource
def read_pieces() -> list[PieceResponse]:
    pieces = DatabaseConnection.execute(select(Piece)).scalars().all()
    return [PieceResponse.model_validate(piece) for piece in pieces]


def _pack_full_piece(piece: Piece, data: dict) -> PieceFullResponse:
    return PieceFullResponse(
        id=piece.id,
        name=piece.name,
        archetype=data["archetype"],
        role_type=data["roleType"],
        movement=data["movement"],
        ability=data["ability"],
        attributes=PieceAttributesResponse(**data["attributes"]),
    )


@router.get("/full", response_model=list[PieceFullResponse])
@read_resource
def get_pieces_full(names: list[str] | None = Query(None)) -> list[PieceFullResponse]:
    query = select(Piece) if names is None else select(Piece).where(Piece.name.in_(names))
    pieces = DatabaseConnection.execute(query).scalars().all()
    assert_preconditions([(names is not None and len(pieces) != len(names), 404, "piece_not_found")], ERRORS)
    catalog = resolve_catalog_entries(names)
    return [_pack_full_piece(piece, catalog[piece.name]) for piece in pieces]


@router.get("/full/{name}", response_model=PieceFullResponse)
@read_resource
def get_piece_full(name: str) -> PieceFullResponse:
    piece = DatabaseConnection.execute(select(Piece).where(Piece.name == name)).scalar_one_or_none()
    assert_preconditions([(piece is None, 404, "piece_not_found")], ERRORS)
    catalog = resolve_catalog_entries([name])
    return _pack_full_piece(piece, catalog[name])


@router.get("/{piece_id}", response_model=PieceResponse)
@read_resource
def read_piece(piece_id: int) -> PieceResponse:
    piece = DatabaseConnection.get(Piece, piece_id)
    assert_preconditions([(piece is None, 404, "piece_not_found")], ERRORS)
    return PieceResponse.model_validate(piece)


@router.get("/name/{name}", response_model=PieceResponse)
@read_resource
def read_piece_by_name(name: str) -> PieceResponse:
    piece = DatabaseConnection.execute(select(Piece).where(Piece.name == name)).scalar_one_or_none()
    assert_preconditions([(piece is None, 404, "piece_not_found")], ERRORS)
    return PieceResponse.model_validate(piece)
