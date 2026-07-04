from enum import Enum

class RoleType(str, Enum):
    # Action is move, can capture enemy pieces.
    UNIT = "UNIT"
    # Action is move, can capture any piece.
    CANNIBAL = "CANNIBAL"
    # Action in move, can't capture piece.
    PACIFIST = "PACIFIST"
    # Action is activate effect.
    BUILDING = "BUILDING"
    # Action is move, lose if dies, ability triggered by every one of your pieces.
    KING = "KING"
