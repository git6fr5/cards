from play.piece.tools import parse_movement, resolve_catalog_entries


KING_ROLE_TYPE = "KING"

MOVEMENT_BUCKETS = {
    "SQUARE":   "square",
    "CROSS":    "cross",
    "DIAGONAL": "diagonal",
    "FORWARD":  "pawn",
    "NONE":     "pawn",
}

BUCKET_CAPS = {
    "square":   (2, 1),
    "cross":    (4, 2),
    "diagonal": (4, 2),
    "pawn":     (16, 8),
}

MAX_KING_QUANTITY = 1
MAX_BAG_SIZE = 27


def validate_bag_composition(pieces: dict[str, int]) -> dict[str, bool]:
    catalog = resolve_catalog_entries(list(pieces.keys()))
    bucket_totals = {bucket: 0 for bucket in BUCKET_CAPS}
    over_name_cap = {bucket: False for bucket in BUCKET_CAPS}
    king_quantity = 0
    total = 0

    for name, quantity in pieces.items():
        data = catalog[name]
        total += quantity
        if data["roleType"] == KING_ROLE_TYPE:
            king_quantity += quantity
            continue
        movement_type, _ = parse_movement(data["movement"])
        bucket = MOVEMENT_BUCKETS[movement_type]
        bucket_totals[bucket] += quantity
        if quantity > BUCKET_CAPS[bucket][1]:
            over_name_cap[bucket] = True

    return {
        "bag_too_large":           total > MAX_BAG_SIZE,
        "bag_king_limit":          king_quantity > MAX_KING_QUANTITY,
        "bag_square_limit":        bucket_totals["square"] > BUCKET_CAPS["square"][0],
        "bag_square_name_limit":   over_name_cap["square"],
        "bag_cross_limit":         bucket_totals["cross"] > BUCKET_CAPS["cross"][0],
        "bag_cross_name_limit":    over_name_cap["cross"],
        "bag_diagonal_limit":      bucket_totals["diagonal"] > BUCKET_CAPS["diagonal"][0],
        "bag_diagonal_name_limit": over_name_cap["diagonal"],
        "bag_pawn_limit":          bucket_totals["pawn"] > BUCKET_CAPS["pawn"][0],
        "bag_pawn_name_limit":     over_name_cap["pawn"],
    }
