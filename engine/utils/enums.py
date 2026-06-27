from enum import Enum

class Alignment(str, Enum):
    FRIENDLY = "FRIENDLY"
    ENEMY = "ENEMY"
    ANY = "ANY"

class Layer(str, Enum):
    BOARD = "BOARD"
    BAG = "BAG"
    SHELF = "SHELF"
