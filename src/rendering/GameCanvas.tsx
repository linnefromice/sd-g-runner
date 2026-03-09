import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  Canvas,
  Group,
  Image,
  LinearGradient,
  matchFont,
  Path,
  Rect,
  RoundedRect,
  Text as SkiaText,
  useTexture,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import type { RenderEntity } from '@/types/rendering';
import type { PopupRenderData } from '@/engine/systems/SyncRenderSystem';
import { SCANLINE_PITCH, SCANLINE_OPACITY, SCORE_POPUP_FONT_SIZE, GRID_PITCH_MIN, GRID_PITCH_MAX, SHADOW_COLOR } from '@/constants/balance';
export type { RenderEntity };

type GameCanvasProps = {
  renderData: ReturnType<typeof useSharedValue<RenderEntity[]>>;
  popupData: ReturnType<typeof useSharedValue<PopupRenderData[]>>;
  scrollY: ReturnType<typeof useSharedValue<number>>;
  scale: number;
};

const MAX_VISIBLE_ENTITIES = 128;

const MAX_SCORE_POPUPS = 16;

const popupFontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
const popupFont = matchFont({
  fontFamily: popupFontFamily,
  fontSize: SCORE_POPUP_FONT_SIZE,
  fontWeight: 'bold',
} as const);

const gateLabelFont = matchFont({
  fontFamily: popupFontFamily,
  fontSize: 10,
  fontWeight: 'bold',
} as const);

function ScorePopupSlot({
  popupData,
  index,
  scale,
}: {
  popupData: GameCanvasProps['popupData'];
  index: number;
  scale: number;
}) {
  const x = useDerivedValue(() => (popupData.value[index]?.x ?? -200) * scale);
  const y = useDerivedValue(() => (popupData.value[index]?.y ?? -200) * scale);
  const text = useDerivedValue(() => popupData.value[index]?.text ?? '');
  const color = useDerivedValue(
    () => popupData.value[index]?.color ?? 'transparent'
  );
  const opacity = useDerivedValue(
    () => popupData.value[index]?.opacity ?? 0
  );

  return (
    <SkiaText
      x={x}
      y={y}
      text={text}
      font={popupFont}
      color={color}
      opacity={opacity}
    />
  );
}

function ScorePopups({
  popupData,
  scale,
}: {
  popupData: GameCanvasProps['popupData'];
  scale: number;
}) {
  const slots = React.useMemo(
    () => Array.from({ length: MAX_SCORE_POPUPS }, (_, i) => i),
    []
  );

  return (
    <>
      {slots.map((i) => (
        <ScorePopupSlot key={i} popupData={popupData} index={i} scale={scale} />
      ))}
    </>
  );
}

function EntitySlot({
  renderData,
  index,
  scale,
  screenHeight,
}: {
  renderData: GameCanvasProps['renderData'];
  index: number;
  scale: number;
  screenHeight: number;
}) {
  // Base properties
  const x = useDerivedValue(() => (renderData.value[index]?.x ?? -200) * scale);
  const y = useDerivedValue(() => (renderData.value[index]?.y ?? -200) * scale);
  const width = useDerivedValue(() => (renderData.value[index]?.width ?? 0) * scale);
  const height = useDerivedValue(() => (renderData.value[index]?.height ?? 0) * scale);
  const color = useDerivedValue(() => renderData.value[index]?.color ?? 'transparent');
  const hpRatio = useDerivedValue(() => renderData.value[index]?.hpRatio ?? -1);

  // Pre-computed SVG path string (already in screen coords from SyncRenderSystem)
  const pathStr = useDerivedValue(() => renderData.value[index]?.path ?? '');
  const type = useDerivedValue(() => renderData.value[index]?.type ?? '');
  const glowPathStr = useDerivedValue(() => renderData.value[index]?.glowPath ?? '');
  // Derive glowColor from pre-computed field and blendMode from type — avoids 2 extra useDerivedValues per slot
  const glowColor = useDerivedValue(() => renderData.value[index]?.glowColor ?? 'transparent');
  const blendMode = useDerivedValue(() => renderData.value[index]?.blendMode as any);
  const shadowPathStr = useDerivedValue(() => renderData.value[index]?.shadowPath ?? '');

  // Opacity split: fill vs stroke (shockwave is stroke-only ring)
  const fillOpacity = useDerivedValue(() =>
    type.value === 'shockwave' ? 0 : (renderData.value[index]?.opacity ?? 0)
  );
  const strokeOpacity = useDerivedValue(() =>
    type.value === 'shockwave' ? (renderData.value[index]?.opacity ?? 0) : 0
  );

  // Rect fallback opacity — non-gate rect types (boostLane, beams)
  const rectOpacity = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e) return 0;
    const t = e.type;
    return (t === 'boostLane' || t === 'exBeam' || t === 'laserWarning' || t === 'laserBeam') ? (e.opacity ?? 0) : 0;
  });

  // Gate-specific opacities — translucent fill + bright borders
  const gateFillOpacity = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e || e.type !== 'gate') return 0;
    return (e.opacity ?? 0) * 0.12;
  });
  const gateBorderOpacity = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e || e.type !== 'gate') return 0;
    return (e.opacity ?? 0) * 0.7;
  });
  const gateAccentOpacity = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e || e.type !== 'gate') return 0;
    return e.opacity ?? 0;
  });
  const gateLabelOpacity = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e || e.type !== 'gate') return 0;
    return 1.0;
  });

  // Gate label — centered horizontally using approximate character width
  const label = useDerivedValue(() => renderData.value[index]?.label ?? '');
  const GATE_ACCENT_W = 3 * scale;
  // Average character width for fontSize 10 bold Helvetica ≈ 6px
  const GATE_CHAR_WIDTH = 6;
  const labelX = useDerivedValue(() => {
    const text = renderData.value[index]?.label ?? '';
    const textW = text.length * GATE_CHAR_WIDTH;
    return x.value + width.value / 2 - textW / 2;
  });
  // Baseline offset: fontSize 10 cap-height ≈ 7px, half = 3.5 ≈ 4
  const labelY = useDerivedValue(() => y.value + height.value / 2 + 4);

  // Gate border positions
  const gateBorderBottomY = useDerivedValue(() => y.value + height.value - 1 * scale);

  // Gate right accent bar position
  const gateRightAccentX = useDerivedValue(() => x.value + width.value - GATE_ACCENT_W);

  // Growth gate progress bar
  const gateProgressW = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e || e.type !== 'gate' || e.gateProgress == null) return 0;
    return width.value * e.gateProgress;
  });
  const gateProgressOpacity = useDerivedValue(() => {
    const e = renderData.value[index];
    if (!e || e.type !== 'gate' || e.gateProgress == null) return 0;
    return 0.2;
  });

  // HP bar (shown for enemies, debris — hpRatio >= 0 and < 1)
  const HP_BAR_H = 2 * scale;
  const HP_BAR_OFFSET = 4 * scale;
  const hpBarY = useDerivedValue(() => y.value - HP_BAR_OFFSET);
  const hpBarFillW = useDerivedValue(() =>
    hpRatio.value >= 0 && hpRatio.value < 1 ? width.value * hpRatio.value : 0
  );
  const hpBarTrackOpacity = useDerivedValue(() =>
    hpRatio.value >= 0 && hpRatio.value < 1 ? 0.4 : 0
  );
  const hpBarFillOpacity = useDerivedValue(() =>
    hpRatio.value >= 0 && hpRatio.value < 1 ? 0.8 : 0
  );
  // HP bar color: pre-computed in SyncRenderSystem (hpBarColor field)
  const hpBarColor = useDerivedValue(() => renderData.value[index]?.hpBarColor ?? '#00FF88');

  return (
    <>
      {/* Directional shadow: offset path in dark color */}
      <Path path={shadowPathStr} color={SHADOW_COLOR} opacity={fillOpacity} />
      {/* Fake glow: enlarged path at embedded alpha */}
      <Path path={glowPathStr} color={glowColor} opacity={fillOpacity} />
      {/* Main shape with top-down lighting gradient */}
      <Path path={pathStr} color={color} opacity={fillOpacity} blendMode={blendMode}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, screenHeight)}
          colors={['#FFFFFF15', '#00000030']}
        />
      </Path>
      {/* Stroke ring (shockwave only) with blendMode */}
      <Path path={pathStr} color={color} opacity={strokeOpacity} style="stroke" strokeWidth={2} blendMode={blendMode} />
      {/* Non-gate rect types (boostLane, beams) with blendMode */}
      <RoundedRect x={x} y={y} width={width} height={height} r={2} color={color} opacity={rectOpacity} blendMode={blendMode} />

      {/* === Gate rendering: translucent fill + neon border lines + symmetric accent bars === */}
      {/* Gate fill — translucent neon glow */}
      <RoundedRect x={x} y={y} width={width} height={height} r={2} color={color} opacity={gateFillOpacity} />
      {/* Gate top border line — white for contrast */}
      <Rect x={x} y={y} width={width} height={1} color="#FFFFFF" opacity={gateBorderOpacity} />
      {/* Gate bottom border line — white for contrast */}
      <Rect x={x} y={gateBorderBottomY} width={width} height={1} color="#FFFFFF" opacity={gateBorderOpacity} />
      {/* Gate left accent bar */}
      <Rect x={x} y={y} width={GATE_ACCENT_W} height={height} color={color} opacity={gateAccentOpacity} />
      {/* Gate right accent bar */}
      <Rect x={gateRightAccentX} y={y} width={GATE_ACCENT_W} height={height} color={color} opacity={gateAccentOpacity} />
      {/* Growth gate progress fill (behind label) */}
      <Rect x={x} y={y} width={gateProgressW} height={height} color={color} opacity={gateProgressOpacity} />
      {/* Gate label text — centered */}
      <SkiaText x={labelX} y={labelY} text={label} font={gateLabelFont} color="#FFFFFF" opacity={gateLabelOpacity} />

      {/* HP bar: track (dark) + fill (colored) — only visible when damaged */}
      <Rect x={x} y={hpBarY} width={width} height={HP_BAR_H} color="#333333" opacity={hpBarTrackOpacity} />
      <Rect x={x} y={hpBarY} width={hpBarFillW} height={HP_BAR_H} color={hpBarColor} opacity={hpBarFillOpacity} />
    </>
  );
}

// Star field — fixed positions with parallax scroll
const STAR_COUNT = 24;
const STAR_LAYER_COLORS = ['#8888FF', '#AACCFF', '#FFFFFF'] as const;
type Star = { x: number; baseY: number; size: number; speed: number; opacity: number; color: string };
function generateStars(width: number, height: number, scale: number): Star[] {
  // Deterministic pseudo-random based on index
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const seed = (i * 7919 + 1) % 997;
    const seed2 = (i * 6271 + 3) % 991;
    const layer = i % 3; // 0=far, 1=mid, 2=near
    stars.push({
      x: (seed / 997) * width,
      baseY: (seed2 / 991) * height,
      size: (layer + 1) * scale,
      speed: 0.15 + layer * 0.15, // far=0.15, mid=0.3, near=0.45
      opacity: 0.12 + layer * 0.19, // far=0.12, mid=0.31, near=0.50
      color: STAR_LAYER_COLORS[layer],
    });
  }
  return stars;
}

function StarField({
  scrollY,
  scale,
  width,
  height,
}: {
  scrollY: GameCanvasProps['scrollY'];
  scale: number;
  width: number;
  height: number;
}) {
  const stars = React.useMemo(() => generateStars(width, height, scale), [width, height, scale]);
  return (
    <>
      {stars.map((star, i) => (
        <StarDot key={i} star={star} scrollY={scrollY} height={height} />
      ))}
    </>
  );
}

function StarDot({ star, scrollY, height }: { star: Star; scrollY: GameCanvasProps['scrollY']; height: number }) {
  const y = useDerivedValue(
    () => ((star.baseY + scrollY.value * star.speed) % (height + star.size * 2)) - star.size
  );
  return <Rect x={star.x} y={y} width={star.size} height={star.size} color={star.color} opacity={star.opacity} />;
}

function GridHLine({
  baseOffset,
  totalCycleHeight,
  scrollY,
  scale,
  width,
  height,
}: {
  baseOffset: number;
  totalCycleHeight: number;
  scrollY: GameCanvasProps['scrollY'];
  scale: number;
  width: number;
  height: number;
}) {
  const y = useDerivedValue(
    () => ((scrollY.value * scale + baseOffset) % totalCycleHeight) - totalCycleHeight * 0.1
  );
  const gridOpacity = useDerivedValue(() => {
    const ratio = y.value / height;
    return 0.15 + Math.max(0, Math.min(1, ratio)) * 0.4;
  });
  return <Rect x={0} y={y} width={width} height={1} color="#2a2a4e" opacity={gridOpacity} />;
}

function ScanlineOverlay({ width, height }: { width: number; height: number }) {
  // Texture height must match screen height to avoid scaling (fit="fill" stretches 1:1)
  const lineCount = Math.ceil(height / SCANLINE_PITCH);
  const texture = useTexture(
    <Group>
      {Array.from({ length: lineCount }, (_, i) => (
        <Rect key={i} x={0} y={i * SCANLINE_PITCH} width={1} height={1} color="#000000" />
      ))}
    </Group>,
    { width: 1, height: lineCount * SCANLINE_PITCH }
  );
  return (
    <Image
      image={texture}
      x={0}
      y={0}
      width={width}
      height={height}
      opacity={SCANLINE_OPACITY}
      fit="fill"
    />
  );
}

function GameCanvasInner({ renderData, popupData, scrollY, scale }: GameCanvasProps) {
  const { width, height } = useWindowDimensions();

  const entitySlots = React.useMemo(
    () => Array.from({ length: MAX_VISIBLE_ENTITIES }, (_, i) => i),
    []
  );

  // Grid lines — horizontal lines scroll with the background, vertical lines are fixed
  const GRID_BASE_SPACING = 80 * scale;
  const GRID_V_SPACING = 80 * scale;
  const GRID_V_COUNT = Math.ceil(width / GRID_V_SPACING) + 1;

  // Pre-compute grid line offsets with variable spacing (dense at top → sparse at bottom)
  const gridHLines = React.useMemo(() => {
    const lines: { baseOffset: number }[] = [];
    let y = 0;
    const totalHeight = height * 1.2; // extra buffer for scroll wrapping
    while (y < totalHeight) {
      lines.push({ baseOffset: y });
      const ratio = y / totalHeight;
      const pitchMultiplier = GRID_PITCH_MIN + (GRID_PITCH_MAX - GRID_PITCH_MIN) * ratio;
      y += GRID_BASE_SPACING * pitchMultiplier;
    }
    return lines;
  }, [height, GRID_BASE_SPACING]);

  const totalCycleHeight = React.useMemo(() => {
    if (gridHLines.length === 0) return height;
    return gridHLines[gridHLines.length - 1].baseOffset + GRID_BASE_SPACING * GRID_PITCH_MAX;
  }, [gridHLines, height, GRID_BASE_SPACING]);

  const gridVSlots = React.useMemo(
    () => Array.from({ length: GRID_V_COUNT }, (_, i) => i),
    [GRID_V_COUNT]
  );

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Rect x={0} y={0} width={width} height={height} color={COLORS.bgDark} />
      {/* Star field (parallax) */}
      <StarField scrollY={scrollY} scale={scale} width={width} height={height} />
      {/* Grid: vertical lines (fixed) */}
      {gridVSlots.map((i) => (
        <Rect key={`gv${i}`} x={i * GRID_V_SPACING} y={0} width={1} height={height} color="#2a2a4e" opacity={0.3} />
      ))}
      {/* Grid: horizontal lines (scroll with background) */}
      {gridHLines.map((line, i) => (
        <GridHLine
          key={`gh${i}`}
          baseOffset={line.baseOffset}
          totalCycleHeight={totalCycleHeight}
          scrollY={scrollY}
          scale={scale}
          width={width}
          height={height}
        />
      ))}

      {/* All entities via pre-allocated slots */}
      {entitySlots.map((index) => (
        <EntitySlot key={index} renderData={renderData} index={index} scale={scale} screenHeight={height} />
      ))}

      {/* Score popup text rendering */}
      <ScorePopups popupData={popupData} scale={scale} />

      {/* CRT scanline overlay */}
      <ScanlineOverlay width={width} height={height} />
    </Canvas>
  );
}

export const GameCanvas = React.memo(GameCanvasInner);
