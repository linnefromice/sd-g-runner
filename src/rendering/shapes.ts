/** Forward-pointing arrow / chevron — Standard form (balanced) */
export function playerPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const bottom = y + h;
  const notch = y + h * 0.7;
  return `M ${cx} ${y} L ${x + w} ${bottom} L ${cx} ${notch} L ${x} ${bottom} Z`;
}

/** Wide armored hull with side cannons — Heavy Artillery form */
export function playerHeavyPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  // Broad trapezoid body + protruding side weapon pods
  return `M ${cx} ${y} L ${x + w * 0.85} ${y + h * 0.3} L ${x + w} ${y + h * 0.35} L ${x + w} ${y + h * 0.7} L ${x + w * 0.75} ${y + h} L ${x + w * 0.25} ${y + h} L ${x} ${y + h * 0.7} L ${x} ${y + h * 0.35} L ${x + w * 0.15} ${y + h * 0.3} Z`;
}

/** Narrow swept-back delta — High Speed form */
export function playerSpeedPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  // Sharp needle nose + swept fins
  return `M ${cx} ${y} L ${x + w * 0.65} ${y + h * 0.6} L ${x + w} ${y + h * 0.85} L ${x + w * 0.6} ${y + h * 0.75} L ${cx} ${y + h} L ${x + w * 0.4} ${y + h * 0.75} L ${x} ${y + h * 0.85} L ${x + w * 0.35} ${y + h * 0.6} Z`;
}

/** Long tapered spear — Sniper form */
export function playerSniperPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  // Elongated arrow with narrow stabilizer fins
  return `M ${cx} ${y} L ${x + w * 0.6} ${y + h * 0.55} L ${x + w * 0.85} ${y + h * 0.65} L ${x + w * 0.55} ${y + h * 0.7} L ${x + w * 0.55} ${y + h} L ${x + w * 0.45} ${y + h} L ${x + w * 0.45} ${y + h * 0.7} L ${x + w * 0.15} ${y + h * 0.65} L ${x + w * 0.4} ${y + h * 0.55} Z`;
}

/** Wide fan shape with spread nozzles — Scatter form */
export function playerScatterPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  // Broad V-wing with multi-barrel front
  return `M ${cx} ${y} L ${x + w * 0.7} ${y + h * 0.25} L ${x + w} ${y + h * 0.2} L ${x + w * 0.85} ${y + h * 0.55} L ${x + w * 0.7} ${y + h} L ${x + w * 0.3} ${y + h} L ${x + w * 0.15} ${y + h * 0.55} L ${x} ${y + h * 0.2} L ${x + w * 0.3} ${y + h * 0.25} Z`;
}

/** Angular star / cross — Awakened form */
export function playerAwakenedPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  // 4-pointed star shape radiating power
  return `M ${cx} ${y} L ${x + w * 0.6} ${y + h * 0.35} L ${x + w} ${y + h * 0.3} L ${x + w * 0.65} ${y + h * 0.5} L ${x + w} ${y + h * 0.7} L ${x + w * 0.6} ${y + h * 0.65} L ${cx} ${y + h} L ${x + w * 0.4} ${y + h * 0.65} L ${x} ${y + h * 0.7} L ${x + w * 0.35} ${y + h * 0.5} L ${x} ${y + h * 0.3} L ${x + w * 0.4} ${y + h * 0.35} Z`;
}

/** Inverted triangle for basic enemies (stationary, rush) */
export function enemyPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  return `M ${x} ${y} L ${x + w} ${y} L ${cx} ${y + h} Z`;
}

/** Shield-bearing trapezoid for phalanx */
export function phalanxPath(x: number, y: number, w: number, h: number): string {
  // Upper shield bar + lower body
  const shieldY = y + h * 0.35;
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${shieldY} L ${x + w * 0.85} ${shieldY} L ${x + w * 0.5} ${y + h} L ${x + w * 0.15} ${shieldY} L ${x} ${shieldY} Z`;
}

/** Large heavy hexagon for juggernaut */
export function juggernautPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  return `M ${cx} ${y} L ${x + w} ${y + h * 0.25} L ${x + w} ${y + h * 0.75} L ${cx} ${y + h} L ${x} ${y + h * 0.75} L ${x} ${y + h * 0.25} Z`;
}

/** Small diamond for swarm */
export function swarmPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`;
}

/** Patrol enemy — wider inverted triangle with side fins */
export function patrolPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  return `M ${cx} ${y + h * 0.15} L ${x + w} ${y} L ${x + w * 0.8} ${y + h * 0.5} L ${cx} ${y + h} L ${x + w * 0.2} ${y + h * 0.5} L ${x} ${y} Z`;
}

/** Hexagon for boss */
export function bossPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ry = h / 2;
  return `M ${cx} ${y} L ${x + w} ${cy - ry * 0.5} L ${x + w} ${cy + ry * 0.5} L ${cx} ${y + h} L ${x} ${cy + ry * 0.5} L ${x} ${cy - ry * 0.5} Z`;
}

/** Octagon with cardinal spike protrusions — Boss 2 (Omega Core) */
export function boss2Path(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M ${cx} ${y - h * 0.1} L ${x + w * 0.7} ${y + h * 0.15} L ${x + w + w * 0.1} ${cy} L ${x + w * 0.7} ${y + h * 0.85} L ${cx} ${y + h + h * 0.1} L ${x + w * 0.3} ${y + h * 0.85} L ${x - w * 0.1} ${cy} L ${x + w * 0.3} ${y + h * 0.15} Z`;
}

/** Diamond with angular edges — Boss 3 (Terminus Core) */
export function boss3Path(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M ${cx} ${y} L ${x + w * 0.75} ${y + h * 0.25} L ${x + w} ${cy} L ${x + w * 0.75} ${y + h * 0.75} L ${cx} ${y + h} L ${x + w * 0.25} ${y + h * 0.75} L ${x} ${cy} L ${x + w * 0.25} ${y + h * 0.25} Z`;
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
    case 'player_SD_Standard':
      return playerPath(x, y, w, h);
    case 'player_SD_HeavyArtillery':
      return playerHeavyPath(x, y, w, h);
    case 'player_SD_HighSpeed':
      return playerSpeedPath(x, y, w, h);
    case 'player_SD_Sniper':
      return playerSniperPath(x, y, w, h);
    case 'player_SD_Scatter':
      return playerScatterPath(x, y, w, h);
    case 'player_SD_Awakened':
      return playerAwakenedPath(x, y, w, h);
    case 'enemy':
    case 'enemy_stationary':
    case 'enemy_rush':
      return enemyPath(x, y, w, h);
    case 'enemy_phalanx':
      return phalanxPath(x, y, w, h);
    case 'enemy_juggernaut':
      return juggernautPath(x, y, w, h);
    case 'enemy_swarm':
      return swarmPath(x, y, w, h);
    case 'enemy_patrol':
      return patrolPath(x, y, w, h);
    case 'boss':
      return bossPath(x, y, w, h);
    case 'boss_2':
      return boss2Path(x, y, w, h);
    case 'boss_3':
      return boss3Path(x, y, w, h);
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
