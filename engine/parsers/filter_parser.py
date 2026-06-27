import re


def parse_filters(line: str) -> dict[str, dict | list]:
    filters = {
        "structure": {},
        "attributes": {}
    }

    parts = line.upper().strip().split()
    if not parts or parts[0] != "WHERE" or parts[1] == "ANY":
        return filters

    attr_pattern = re.compile(r"ATT:([A-Z_]+)(<=|>=|<|>|=)(\d+)")

    for criterion in parts[1:]:
        if match := attr_pattern.match(criterion):
            attr_name, operator, value = match.groups()
            filters["attributes"][attr_name.lower()] = (operator, int(value))
        elif ":" in criterion:
            key, raw_values = criterion.split(":", 1)
            filters["structure"][key.lower()] = raw_values.lower().split("|")

    return filters

def satisfies_filters(filters : dict[str, dict | list]):
    pass
