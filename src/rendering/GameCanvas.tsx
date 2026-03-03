import React from "react";
import { useWindowDimensions } from "react-native";
import { Canvas, Rect, vec, RoundedRect } from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";

export type RenderEntity = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type GameCanvasProps = {
  renderData: ReturnType<typeof useSharedValue<RenderEntity[]>>;
};

const MAX_VISIBLE_ENTITIES = 64;

function EntityRect({
  renderData,
  index,
}: {
  renderData: GameCanvasProps["renderData"];
  index: number;
}) {
  const x = useDerivedValue(() => renderData.value[index]?.x ?? -100);
  const y = useDerivedValue(() => renderData.value[index]?.y ?? -100);
  const width = useDerivedValue(() => renderData.value[index]?.width ?? 0);
  const height = useDerivedValue(() => renderData.value[index]?.height ?? 0);
  const color = useDerivedValue(
    () => renderData.value[index]?.color ?? "transparent"
  );

  return <Rect x={x} y={y} width={width} height={height} color={color} />;
}

function GameCanvasInner({ renderData }: GameCanvasProps) {
  const { width, height } = useWindowDimensions();

  const entitySlots = React.useMemo(
    () => Array.from({ length: MAX_VISIBLE_ENTITIES }, (_, i) => i),
    []
  );

  return (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color="#0a0a14" />
      {entitySlots.map((index) => (
        <EntityRect key={index} renderData={renderData} index={index} />
      ))}
    </Canvas>
  );
}

export const GameCanvas = React.memo(GameCanvasInner);
