// src/rendering/shapes.ts

/** Forward-pointing arrow / chevron for player */
export function playerPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const bottom = y + h;
  const notch = y + h * 0.7;
  return `M ${cx} ${y} L ${x + w} ${bottom} L ${cx} ${notch} L ${x} ${bottom} Z`;
}

/** Inverted triangle for enemies */
export function enemyPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  return `M ${x} ${y} L ${x + w} ${y} L ${cx} ${y + h} Z`;
}

/** Hexagon for boss */
export function bossPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ry = h / 2;
  return `M ${cx} ${y} L ${x + w} ${cy - ry * 0.5} L ${x + w} ${cy + ry * 0.5} L ${cx} ${y + h} L ${x} ${cy + ry * 0.5} L ${x} ${cy - ry * 0.5} Z`;
}

/** Vertically elongated diamond for bullets */
export function diamondPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`;
}

/** Irregular pentagon for debris */
export function debrisPath(x: number, y: number, w: number, h: number): string {
  return `M ${x + w * 0.2} ${y} L ${x + w * 0.8} ${y + h * 0.1} L ${x + w} ${y + h * 0.6} L ${x + w * 0.5} ${y + h} L ${x} ${y + h * 0.5} Z`;
}

/** Circle via cubic Bezier approximation */
export function circlePath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const k = 0.5522847498;
  const kx = rx * k;
  const ky = ry * k;
  return `M ${cx} ${y} C ${cx + kx} ${y} ${x + w} ${cy - ky} ${x + w} ${cy} C ${x + w} ${cy + ky} ${cx + kx} ${y + h} ${cx} ${y + h} C ${cx - kx} ${y + h} ${x} ${cy + ky} ${x} ${cy} C ${x} ${cy - ky} ${cx - kx} ${y} ${cx} ${y} Z`;
}

/** Select path builder by entity type. Returns null for rect-based types. */
export function getEntityPath(
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
): string | null {
  switch (type) {
    case 'player':
      return playerPath(x, y, w, h);
    case 'enemy':
      return enemyPath(x, y, w, h);
    case 'boss':
      return bossPath(x, y, w, h);
    case 'playerBullet':
      return diamondPath(x, y, w, h);
    case 'enemyBullet':
      return diamondPath(x, y, w, h);
    case 'debris':
      return debrisPath(x, y, w, h);
    case 'particle':
      return circlePath(x, y, w, h);
    case 'shockwave':
      return circlePath(x, y, w, h);
    default:
      return null;
  }
}
