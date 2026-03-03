import React from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Shadow,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

export type RenderEntity = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  label?: string;
};

type GameCanvasProps = {
  renderData: ReturnType<typeof useSharedValue<RenderEntity[]>>;
  scrollY: ReturnType<typeof useSharedValue<number>>;
  scale: number;
};

const MAX_VISIBLE_ENTITIES = 128;

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

function GameCanvasInner({ renderData, scrollY, scale }: GameCanvasProps) {
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
    </Canvas>
  );
}

export const GameCanvas = React.memo(GameCanvasInner);
