from enum import Enum

class Archetype(str, Enum):
    SOLDIER = "SOLDIER"
    GOBLIN = "GOBLIN"
    WARLOCK = "WARLOCK"
    TIMER = "TIMER"
    MESSENGER = "MESSENGER"
    TURRET = "TURRET"

    @staticmethod
    def get_color(archetype: "Archetype") -> str:
        return ArchetypeColorMap[archetype]


ArchetypeColorMap: dict[Archetype, str] = {
    Archetype.SOLDIER: "#DC2626",
    Archetype.GOBLIN: "#16A34A",
    Archetype.WARLOCK: "#4B5563",
    Archetype.TIMER: "#CA8A04",
    Archetype.MESSENGER: "#0EA5E9",
    Archetype.TURRET: "#7C3AED",
}
