import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import {
  Canvas,
  matchFont,
  Rect,
  RoundedRect,
  Shadow,
  Text as SkiaText,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';
import type { RenderEntity } from '@/types/rendering';
import type { PopupRenderData } from '@/engine/systems/SyncRenderSystem';
import { SCORE_POPUP_FONT_SIZE } from '@/constants/balance';
export type { RenderEntity };

type GameCanvasProps = {
  renderData: ReturnType<typeof useSharedValue<RenderEntity[]>>;
  popupData: ReturnType<typeof useSharedValue<PopupRenderData[]>>;
  scrollY: ReturnType<typeof useSharedValue<number>>;
  scale: number;
};

const MAX_VISIBLE_ENTITIES = 256;

const MAX_SCORE_POPUPS = 16;

const popupFontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
const popupFont = matchFont({
  fontFamily: popupFontFamily,
  fontSize: SCORE_POPUP_FONT_SIZE,
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
}: {
  renderData: GameCanvasProps['renderData'];
  index: number;
  scale: number;
}) {
  const x = useDerivedValue(() => (renderData.value[index]?.x ?? -200) * scale);
  const y = useDerivedValue(() => (renderData.value[index]?.y ?? -200) * scale);
  const width = useDerivedValue(() => (renderData.value[index]?.width ?? 0) * scale);
  const height = useDerivedValue(() => (renderData.value[index]?.height ?? 0) * scale);
  const color = useDerivedValue(() => renderData.value[index]?.color ?? 'transparent');
  const opacity = useDerivedValue(() => renderData.value[index]?.opacity ?? 0);

  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={2}
      color={color}
      opacity={opacity}
    >
      <Shadow dx={0} dy={0} blur={6} color={color} />
    </RoundedRect>
  );
}

function GameCanvasInner({ renderData, popupData, scrollY, scale }: GameCanvasProps) {
  const { width, height } = useWindowDimensions();

  const entitySlots = React.useMemo(
    () => Array.from({ length: MAX_VISIBLE_ENTITIES }, (_, i) => i),
    []
  );

  // Background scroll lines for visual feedback
  const bgLineY1 = useDerivedValue(() => (scrollY.value * scale) % (height + 100) - 100);
  const bgLineY2 = useDerivedValue(() => ((scrollY.value * scale) + height / 2) % (height + 100) - 100);

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Rect x={0} y={0} width={width} height={height} color={COLORS.bgDark} />
      {/* Scroll indicator lines */}
      <Rect x={0} y={bgLineY1} width={width} height={1} color="#1a1a2e" opacity={0.5} />
      <Rect x={0} y={bgLineY2} width={width} height={1} color="#1a1a2e" opacity={0.5} />

      {/* All entities via pre-allocated slots */}
      {entitySlots.map((index) => (
        <EntitySlot key={index} renderData={renderData} index={index} scale={scale} />
      ))}

      {/* Score popup text rendering */}
      <ScorePopups popupData={popupData} scale={scale} />
    </Canvas>
  );
}

export const GameCanvas = React.memo(GameCanvasInner);
