from __future__ import annotations
from dataclasses import dataclass, field
from engine.entities.piece import KingPiece, Piece
from engine.utils.positions import Position
from engine.entities.board import Board
from engine.enums.patterns import Patterns
from engine.enums.triggers import TriggerCondition as Trigger
from engine.game import game
from engine.resolver import fire_trigger
from engine.utils.input_parser import format_square


@dataclass
class InputOutcome:
    valid: bool
    outcome: str

FAR_RANK = {0: Board.BOARD_HEIGHT - 1, 1: 0}

@dataclass
class Player:

    player_id: int
    king: KingPiece | None = None
    shelf: list[Piece] = field(default_factory=list)
    bag: list[Piece] = field(default_factory=list)
    current_mana: int = 0
    total_mana: int = 0

    @property
    def shelf_size(self):
        return len(self.shelf)

    def draw(self, count: int = 1) -> None:
        for _ in range(count):
            if not self.bag:
                return  # Can't draw from an empty bag
            draw_index = game.rng.randrange(len(self.bag))
            self.shelf.append(self.bag.pop(draw_index))

    def summon(self, shelf_index: int, position: Position) -> InputOutcome:
        board = game.board
        if not (0 <= shelf_index < len(self.shelf)):
            return InputOutcome(False, "Invalid shelf choice")
        if not board.is_within(position):
            return InputOutcome(False, "Not on board")
        if board.is_occupied(position):
            return InputOutcome(False, "Position occupied")
        if not Patterns.is_within(self.king.position, position, self.king.summoning):
            return InputOutcome(False, "Not valid summoning position")

        piece = self.shelf[shelf_index]
        summon_cost = piece.attributes.get("summon_cost")
        if summon_cost > self.current_mana:
            return InputOutcome(False, f"Not enough mana, need {summon_cost}")

        summoned_piece = self.shelf.pop(shelf_index)
        board.pieces[position] = summoned_piece

        self.current_mana -= piece.attributes.get("summon_cost")
        summoned_piece.attributes.modify("action_count", -99, 1, "Summoning Sleep")

        fire_trigger(Trigger.SUMMON, summoned_piece)
        fire_trigger(Trigger.SUMMON, self.king)
        return InputOutcome(True, f"Player {self.player_id} summoned {summoned_piece.name} at {position}")

    def act(self, origin: Position, target: Position) -> InputOutcome:
        board = game.board
        if not board.is_occupied(origin):
            return InputOutcome(False, "Not occupied")
        if not board.is_within(target):
            return InputOutcome(False, "Not on board")

        piece = board.pieces[origin]
        if not self.owns(piece):
            return InputOutcome(False, "Not your piece!")
        action_cost = piece.attributes.get("action_cost")
        if action_cost > self.current_mana:
            return InputOutcome(False, f"Not enough mana, need {action_cost}")
        if piece.attributes.get("action_count") <= 0:
            return InputOutcome(False, "Can't move")

        target_piece = board.pieces.get(target)
        if not self.can_target(piece, target_piece):
            if self.owns(target_piece):
                return InputOutcome(False, "Position occupied")
            return InputOutcome(False, "Can't capture")
        if target not in self._legal_moves(origin):
            return InputOutcome(False, "Not a valid move")

        if piece.is_building:
            fire_trigger(Trigger.ACTIVATE, piece, target_piece)
            result = f"Player {self.player_id} activated {piece.name} targeting {target}"
        else:

            del board.pieces[origin]
            board.pieces[target] = piece

            fire_trigger(Trigger.MOVE, piece)
            fire_trigger(Trigger.MOVE, self.king)

            if target.y == FAR_RANK[self.player_id]:
                fire_trigger(Trigger.PROMOTION, piece)

            if target_piece:
                fire_trigger(Trigger.KILL, piece, target_piece)
                fire_trigger(Trigger.KILL, self.king, target_piece)

                fire_trigger(Trigger.DEATH, target_piece, piece)
                fire_trigger(Trigger.DEATH, target_piece.player.king, piece)
                result = f"Player {self.player_id} moved {piece.name} from {origin} to {target}, capturing {target_piece.name}"
            else:
                result = f"Player {self.player_id} moved {piece.name} from {origin} to {target}"

        self.current_mana -= piece.attributes.get("action_cost")
        piece.attributes.modify("action_count", -1, 1, "Fatigue")
        return InputOutcome(True, result)

    def end_turn(self) -> None:
        board_pieces = [piece for piece in game.board.pieces.values() if piece.player is self]

        for piece in board_pieces + self.shelf + self.bag:
            for modifier in piece.attributes.modifiers:
                modifier.turns_left -= 1
            piece.attributes.modifiers = [
                modifier for modifier in piece.attributes.modifiers
                if modifier.turns_left > 0
            ]

        for piece in board_pieces:
            if piece is not self.king:
                fire_trigger(Trigger.TURNEND, piece)

        fire_trigger(Trigger.TURNEND, self.king)

    def owns(self, piece: Piece) -> bool:
        return piece.player.player_id == self.player_id

    def can_target(self, piece: Piece, target_piece: Piece | None) -> bool:
        if not target_piece:
            return True
        if self.owns(target_piece):
            return piece.can_capture_allies
        return piece.can_capture_enemies

    def _legal_moves(self, origin: Position) -> list[Position]:
        board = game.board
        piece = board.pieces.get(origin)
        if not piece or not self.owns(piece):
            return []

        positions = []
        for offset in piece.movement:
            target = origin.translate(offset)
            if not board.is_within(target):
                continue
            if board.path_blocked(origin, target):
                continue
            if not self.can_target(piece, board.pieces.get(target)):
                continue
            positions.append(target)

        return positions

    def show(self, origin: Position) -> InputOutcome:
        piece = game.board.pieces.get(origin)
        if not piece:
            return InputOutcome(False, "Not occupied")
        if not self.owns(piece):
            return InputOutcome(False, "Not your piece!")

        positions = self._legal_moves(origin)
        if not positions:
            return InputOutcome(True, "No legal moves")
        return InputOutcome(True, ", ".join(format_square(p) for p in positions))

    def read(self, origin: Position | None = None, shelf_index: int | None = None) -> InputOutcome:
        board = game.board
        if origin is not None:
            piece = board.pieces.get(origin)
        else:
            if not (0 <= shelf_index < len(self.shelf)):
                return InputOutcome(False, "Invalid shelf choice")
            piece = self.shelf[shelf_index]

        if not piece:
            return InputOutcome(False, "Not occupied")

        return InputOutcome(True, piece.describe_ability())