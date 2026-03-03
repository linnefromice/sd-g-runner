import type { GateEntity } from '@/types/entities';
import type { GateDefinition, GatePairConfig } from '@/types/gates';
import { HITBOX, GATE_OPTIONAL_WIDTH, LOGICAL_WIDTH } from '@/constants/dimensions';

let nextId = 0;

function createSingleGate(def: GateDefinition, x: number, y: number, width: number): GateEntity {
  return {
    id: `gate_${nextId++}`,
    type: 'gate',
    gateType: def.type,
    x,
    y,
    width,
    height: HITBOX.gate.height,
    active: true,
    displayLabel: def.displayLabel,
    effects: def.effects,
    passed: false,
  };
}

export function createGatePair(config: GatePairConfig, y: number): [GateEntity, GateEntity] {
  if (config.layout === 'forced') {
    // Forced: two gates cover full width (140 + 40gap + 140 = 320)
    const gateWidth = HITBOX.gate.width;
    const leftX = 0;
    const rightX = LOGICAL_WIDTH - gateWidth;
    return [
      createSingleGate(config.left, leftX, y, gateWidth),
      createSingleGate(config.right, rightX, y, gateWidth),
    ];
  } else {
    // Optional: narrower gates with gaps on sides and center
    const gateWidth = GATE_OPTIONAL_WIDTH;
    const totalGap = LOGICAL_WIDTH - gateWidth * 2;
    const sideGap = totalGap / 3;
    const leftX = sideGap;
    const rightX = LOGICAL_WIDTH - sideGap - gateWidth;
    return [
      createSingleGate(config.left, leftX, y, gateWidth),
      createSingleGate(config.right, rightX, y, gateWidth),
    ];
  }
}

export function deactivateGate(gate: GateEntity): void {
  gate.active = false;
  gate.x = -100;
  gate.y = -100;
}
