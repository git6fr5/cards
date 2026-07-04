from enum import Enum

class Archetype(str, Enum):
    DRAGON = "DRAGON"
    GOBLIN = "GOBLIN"

    @staticmethod
    def get_color(archetype: "Archetype") -> str:
        return ArchetypeColorMap[archetype]


ArchetypeColorMap: dict[Archetype, str] = {
    Archetype.DRAGON: "#DC2626",
    Archetype.GOBLIN: "#16A34A",
}
