export const LIGHT_AZIMUTH = 235;
export const LIGHT_ELEVATION = 55;

export function getHighlightPosition(): string {
  const rad = (LIGHT_AZIMUTH * Math.PI) / 180;
  const x = 50 - Math.cos(rad) * 30;
  const y = 50 - Math.sin(rad) * 30;
  return `${x.toFixed(0)}% ${y.toFixed(0)}%`;
}
