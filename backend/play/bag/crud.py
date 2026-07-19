from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from play.auth import BagAuthContext, PlayerAuthContext, require_bag_access, require_player_access
from play.orm.bag import Bag, BagPiece
from play.orm.piece import Piece
from utils.databases import create_resource, read_resource, update_resource, delete_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "bag_name_already_exists":    "A bag with that name already exists for this player.",
    "piece_not_found":            "One of the given piece names does not exist.",
    "quantity_would_go_negative": "The requested change would take a piece's quantity below zero.",
}


class CreateBagRequest(BaseModel):
    name: str


class UpdateBagNameRequest(BaseModel):
    name: str


class UpdateBagPiecesRequest(BaseModel):
    delta_pieces: dict[str, int]


class BagPieceResponse(BaseModel):
    piece_name: str
    quantity:   int


class BagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:         int
    name:       str
    created_at: datetime
    player_id:  int
    pieces:     list[BagPieceResponse]


class DeleteBagResponse(BaseModel):
    deleted: bool


def _pack_bag(bag: Bag) -> BagResponse:
    pieces = [
        BagPieceResponse(piece_name=entry.piece.name, quantity=entry.quantity)
        for entry in bag.bag_pieces
    ]
    return BagResponse(
        id=bag.id, name=bag.name, created_at=bag.created_at, player_id=bag.player_id, pieces=pieces,
    )


@router.post("", status_code=201, response_model=BagResponse)
@create_resource
def create_bag(body: CreateBagRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> Bag:
    existing = DatabaseConnection.execute(
        select(Bag).where(Bag.player_id == auth.player_id, Bag.name == body.name)
    ).scalar_one_or_none()
    assert_preconditions([(existing is not None, 409, "bag_name_already_exists")], ERRORS)
    return Bag(player_id=auth.player_id, name=body.name)


@router.get("", response_model=list[BagResponse])
@read_resource
def read_bags(auth: PlayerAuthContext = Depends(require_player_access)) -> list[BagResponse]:
    bags = DatabaseConnection.execute(
        select(Bag).where(Bag.player_id == auth.player_id)
    ).scalars().all()
    return [_pack_bag(bag) for bag in bags]


@router.get("/{bag_id}", response_model=BagResponse)
@read_resource
def read_bag(bag_id: int, auth: BagAuthContext = Depends(require_bag_access)) -> BagResponse:
    bag = DatabaseConnection.get(Bag, bag_id)
    return _pack_bag(bag)


@router.put("/{bag_id}/name", response_model=BagResponse)
@update_resource
def update_bag_name(bag_id: int, body: UpdateBagNameRequest, auth: BagAuthContext = Depends(require_bag_access)) -> BagResponse:
    bag = DatabaseConnection.get(Bag, bag_id)
    bag.name = body.name
    return _pack_bag(bag)


@router.put("/{bag_id}/pieces", response_model=BagResponse)
@update_resource
def update_bag_pieces(bag_id: int, body: UpdateBagPiecesRequest, auth: BagAuthContext = Depends(require_bag_access)) -> BagResponse:
    bag = DatabaseConnection.get(Bag, bag_id)

    piece_names = list(body.delta_pieces.keys())
    pieces_by_name = {
        piece.name: piece
        for piece in DatabaseConnection.execute(select(Piece).where(Piece.name.in_(piece_names))).scalars().all()
    }
    assert_preconditions([(len(pieces_by_name) != len(piece_names), 422, "piece_not_found")], ERRORS)

    entries_by_piece_id = {entry.piece_id: entry for entry in bag.bag_pieces}
    new_quantities = {
        pieces_by_name[name].id: (
            entries_by_piece_id[pieces_by_name[name].id].quantity + delta
            if pieces_by_name[name].id in entries_by_piece_id else delta
        )
        for name, delta in body.delta_pieces.items()
    }
    assert_preconditions([(any(quantity < 0 for quantity in new_quantities.values()), 422, "quantity_would_go_negative")], ERRORS)

    for piece_id, new_quantity in new_quantities.items():
        entry = entries_by_piece_id.get(piece_id)
        if entry is None:
            bag.bag_pieces.append(BagPiece(piece_id=piece_id, quantity=new_quantity))
        elif new_quantity == 0:
            bag.bag_pieces.remove(entry)
        else:
            entry.quantity = new_quantity

    return _pack_bag(bag)


@router.delete("/{bag_id}", response_model=DeleteBagResponse)
@delete_resource
def delete_bag(bag_id: int, auth: BagAuthContext = Depends(require_bag_access)) -> DeleteBagResponse:
    bag = DatabaseConnection.get(Bag, bag_id)
    DatabaseConnection.delete(bag)
    return DeleteBagResponse(deleted=True)
