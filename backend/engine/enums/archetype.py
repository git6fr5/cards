from enum import Enum

class Archetype(str, Enum):
    SOLDIER = "SOLDIER"
    TIMEKEEPER = "TIMEKEEPER"
    NOMAD = "NOMAD"
    TURRET = "TURRET"
    BERSERKER = "BERSERKER"
    VANGUARD = "VANGUARD"
    DEMON = "DEMON"
    TRAP = "TRAP"

    @staticmethod
    def get_color(archetype: "Archetype") -> str:
        return ArchetypeColorMap[archetype]


ArchetypeColorMap: dict[Archetype, str] = {
    Archetype.SOLDIER: "#6B7280",
    Archetype.TIMEKEEPER: "#CA8A04",
    Archetype.NOMAD: "#0EA5E9",
    Archetype.TURRET: "#7C3AED",
    Archetype.BERSERKER: "#7F1D1D",
    Archetype.VANGUARD: "#C026D3",
    Archetype.DEMON: "#1E293B",
    Archetype.TRAP: "#78350F",
}
