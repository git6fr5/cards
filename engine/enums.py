from enum import Enum

# Board is BOARD_SIZE x BOARD_SIZE. Player 0 fills from row 0 inward,
# player 1 from row BOARD_SIZE-1 inward; promotion happens on the far rank.
BOARD_SIZE = 8


class Archetype(str, Enum):
    DRAGON = "DRAGON"
    GOBLIN = "GOBLIN"


class PieceType(str, Enum):
    UNIT = "UNIT" # normal rules
    BUILDING = "BUILDING" # movement doesn't actually move it- but rather activates its effect on that position
    KING = "KING" # its effect can be triggered by any of your pieces.

class Layer(str, Enum):
    BOARD = "BOARD"
    SHELF = "SHELF"   # player's hand
    BAG   = "BAG"     # player's draw pool


class Trigger(str, Enum):
    KILL      = "KILL"
    DEATH     = "DEATH"
    MOVE      = "MOVE"
    SUMMON    = "SUMMON"
    ACTIVATE  = "ACTIVATE"
    TURN_END  = "TURN_END"
    PROMOTION = "PROMOTION"


class Selection(str, Enum):
    SELF            = "SELF"
    ALL             = "ALL"
    MATRIX          = "MATRIX"
    SPECIFIC        = "SPECIFIC"
    RANDOM          = "RANDOM"
    MOST_EXPENSIVE  = "MOST_EXPENSIVE"
    LEAST_EXPENSIVE = "LEAST_EXPENSIVE"


class EffectOp(str, Enum):
    KILL            = "KILL"
    SUMMON          = "SUMMON"
    PUT             = "PUT"          # PUT [LAYER] — move target into a layer (BOARD|SHELF|BAG)
    SUMMON_COST_MOD = "SUMMON_COST_MOD"
    MOVE_COUNT_MOD  = "MOVE_COUNT_MOD"


class FilterKey(str, Enum):
    ARCHETYPE      = "ARCHETYPE"
    SUMMON_COST    = "SUMMON_COST"
    MOVEMENT_COST  = "MOVEMENT_COST"
    MOVEMENT_COUNT = "MOVEMENT_COUNT"


class CompareOp(str, Enum):
    EQ  = "="
    LT  = "<"
    GT  = ">"
    LTE = "<="
    GTE = ">="
