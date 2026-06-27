from __future__ import annotations
import random
from dataclasses import dataclass
from engine.entities.pieces.piece import KingPiece, Piece
from engine.utils.positions import Position
from engine.entities.board import Board
from engine.parsers.trigger_parser import TriggerCondition as Trigger

@dataclass
class Player:

    player_id: int
    king: KingPiece
    shelf: list[Piece]
    bag: list[Piece]
    current_mana: int = 0
    total_mana: int = 0

    def load(self) -> None:
        for piece in self.bag:
            piece.ability = parse_ability(self.raw_ability_dsl)
            
        for i in range(3):
            self.draw()

    def draw(self) -> None:
        if not self.bag:
            return  # Can't draw from an empty bag
        draw_index = random.randrange(len(self.bag))
        self.shelf.append(self.bag.pop(draw_index))

    def summon(self, shelf_index: int, position: Position, board: Board) -> str | None:
        if not (0 <= shelf_index < len(self.shelf)):
            return "Invalid shelf choice"
        if not board.within_bounds(position):
            return "Not on board"
        if board.is_occupied(position):
            return "Position occupied"
        if not position.is_within_area_pattern(self.king.position, self.king.summoning):
            return "Not valid summoning position"

        piece = self.shelf[shelf_index]
        if piece.attributes.get("summon_cost") > self.current_mana:
            return "Not enough mana"    

        summoned_piece = self.shelf.pop(shelf_index)
        board.pieces[position] = summoned_piece

        self.current_mana -= piece.attributes.get("summon_cost")
        summoned_piece.attributes.modify("action_count", -99, 1, "Summoning Sleep")

        fire_trigger(Trigger.SUMMON, summoned_piece)
        fire_trigger(Trigger.SUMMON, self.king)
        return None
    
    def act(self, origin: Position, target: Position, board: Board) -> str | None:
        if not board.is_occupied(origin):
            return "Not occupied"
        if not board.within_bounds(target):
            return "Not on board"
        
        piece = board.pieces[origin]
        if not self.owns(piece):
            return "Not your piece!"
        if piece.attributes.get("action_cost") > self.current_mana:
            return "Not enough mana"    
        if piece.attributes.get("action_count") <= 0:
            return "Can't move"
        
        target_piece = board.pieces.get(target)
        if target_piece and self.owns(target_piece) and not piece.can_target_own_pieces:
                return "Position occupied"

        if piece.is_building:
            fire_trigger(Trigger.ACTIVATE, piece, target_piece)
        else:

            del board.pieces[origin]
            board.pieces[target] = piece

            fire_trigger(Trigger.MOVE, piece)
            fire_trigger(Trigger.MOVE, self.king)

            if target_piece:
                fire_trigger(Trigger.KILL, piece, target_piece)
                fire_trigger(Trigger.KILL, self.king, target_piece)

                fire_trigger(Trigger.DEATH, target_piece, piece)
                fire_trigger(Trigger.DEATH, target_piece.get_player().king, piece)

        self.current_mana -= piece.attributes.get("action_cost")
        piece.attributes.modify("action_count", -1, 1, "Fatigue")
        return None
    
    def owns(self, piece: Piece):
        return piece.player_id == self.player_id