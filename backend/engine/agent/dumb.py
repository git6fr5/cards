from engine.enums.patterns import Patterns
from engine.game import Game
from engine.utils.input_parser import format_square
from engine.utils.positions import Position


class DumbAgent:
    def decide(self, game: Game, viewer_index: int) -> str:
        player = game.players[viewer_index]
        board = game.board

        options = []
        for origin, piece in board.pieces.items():
            if not player.owns(piece):
                continue
            if piece.attributes.get("action_cost") > player.current_mana:
                continue
            if piece.attributes.get("action_count") <= 0:
                continue
            for target in player._legal_moves(origin):
                options.append(f"{format_square(origin)}@{format_square(target)}")

        for shelf_index, piece in enumerate(player.shelf):
            if piece.attributes.get("summon_cost") > player.current_mana:
                continue
            for x in range(board.BOARD_WIDTH):
                for y in range(board.BOARD_HEIGHT):
                    position = Position(x, y)
                    if board.is_occupied(position):
                        continue
                    if not Patterns.is_within(player.king.position, position, player.king.summoning):
                        continue
                    options.append(f"S{shelf_index}@{format_square(position)}")

        if not options:
            return "EOT"
        return game.rng.choice(options)
