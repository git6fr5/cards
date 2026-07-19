from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import aliased

from accounts.orm.user import User
from play.auth import PlayerAuthContext, require_player_access
from play.orm.game import Game
from play.orm.game_player import GamePlayer
from play.orm.player import Player
from utils.databases import DatabaseConnection, read_resource


router = APIRouter()


class GameActiveResponse(BaseModel):
    room:                  UUID
    opponent_display_name: str | None
    created_at:            datetime
    player_index:          int


@router.get("/active", response_model=list[GameActiveResponse])
@read_resource
def read_active_games(auth: PlayerAuthContext = Depends(require_player_access)) -> list[GameActiveResponse]:
    unclaimed = aliased(GamePlayer)
    rows = DatabaseConnection.execute(
        select(Game, GamePlayer.player_index)
        .join(GamePlayer, GamePlayer.game_id == Game.id)
        .where(
            GamePlayer.player_id == auth.player_id,
            Game.is_game_over == False,
            ~select(unclaimed.id).where(unclaimed.game_id == Game.id, unclaimed.player_id.is_(None)).exists(),
        )
        .order_by(Game.created_at.desc())
    ).all()

    game_ids = [game.id for game, _ in rows]
    opponent_rows = DatabaseConnection.execute(
        select(GamePlayer.game_id, User.display_name)
        .join(Player, Player.id == GamePlayer.player_id)
        .join(User, User.id == Player.user_id)
        .where(GamePlayer.game_id.in_(game_ids), GamePlayer.player_id != auth.player_id)
    ).all()
    opponent_display_name_by_game_id = {game_id: display_name for game_id, display_name in opponent_rows}

    return [
        GameActiveResponse(
            room=game.room,
            opponent_display_name=opponent_display_name_by_game_id.get(game.id),
            created_at=game.created_at,
            player_index=player_index,
        )
        for game, player_index in rows
    ]
