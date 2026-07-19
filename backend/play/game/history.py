from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from accounts.orm.user import User
from play.auth import PlayerAuthContext, require_player_access
from play.orm.game import Game
from play.orm.game_player import GamePlayer
from play.orm.player import Player
from utils.databases import DatabaseConnection, read_resource


router = APIRouter()


class GameHistoryResponse(BaseModel):
    room:                  UUID
    result:                str
    opponent_display_name: str | None
    created_at:            datetime


@router.get("/history", response_model=list[GameHistoryResponse])
@read_resource
def read_game_history(auth: PlayerAuthContext = Depends(require_player_access)) -> list[GameHistoryResponse]:
    games = DatabaseConnection.execute(
        select(Game)
        .join(GamePlayer, GamePlayer.game_id == Game.id)
        .where(GamePlayer.player_id == auth.player_id, Game.is_game_over == True)
        .order_by(Game.created_at.desc())
    ).scalars().all()

    game_ids = [game.id for game in games]
    opponent_rows = DatabaseConnection.execute(
        select(GamePlayer.game_id, User.display_name)
        .join(Player, Player.id == GamePlayer.player_id)
        .join(User, User.id == Player.user_id)
        .where(GamePlayer.game_id.in_(game_ids), GamePlayer.player_id != auth.player_id)
    ).all()
    opponent_display_name_by_game_id = {game_id: display_name for game_id, display_name in opponent_rows}

    return [
        GameHistoryResponse(
            room=game.room,
            result="win" if game.winner_player_id == auth.player_id else "loss",
            opponent_display_name=opponent_display_name_by_game_id.get(game.id),
            created_at=game.created_at,
        )
        for game in games
    ]
