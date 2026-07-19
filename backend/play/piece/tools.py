from engine.loader import load_catalog


def resolve_catalog_entries(names: list[str] | None) -> dict[str, dict]:
    catalog = load_catalog()
    if names is None:
        return catalog
    return {name: catalog[name] for name in names if name in catalog}
