export function toSnakeCase(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export function getPieceArtSrc(name: string): string {
  return `/${toSnakeCase(name)}.svg`;
}
