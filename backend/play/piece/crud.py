from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from play.orm.piece import Piece
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


@router.get("", response_model=list[PieceResponse])
@read_resource
def read_pieces() -> list[PieceResponse]:
    pieces = DatabaseConnection.execute(select(Piece)).scalars().all()
    return [PieceResponse.model_validate(piece) for piece in pieces]


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
