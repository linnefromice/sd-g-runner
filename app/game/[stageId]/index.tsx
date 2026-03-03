import { useCallback, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { useGameLoop, type GameSystem } from "@/engine/GameLoop";
import { GameCanvas, type RenderEntity } from "@/rendering/GameCanvas";
import { HUD } from "@/ui/HUD";
import { useGameSessionStore } from "@/stores/gameSessionStore";

type SpikeEntity = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
};

type SpikeEntities = {
  entities: SpikeEntity[];
  player: { targetX: number; targetY: number };
};

const ENTITY_COUNT = 50;
const COLORS = ["#00e5ff", "#ff4081", "#76ff03", "#ffea00", "#e040fb"];

function createInitialEntities(
  screenWidth: number,
  screenHeight: number
): SpikeEntities {
  const entities: SpikeEntity[] = [];
  for (let i = 0; i < ENTITY_COUNT; i++) {
    entities.push({
      x: Math.random() * (screenWidth - 16),
      y: Math.random() * (screenHeight - 16),
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120,
      width: 12 + Math.random() * 12,
      height: 12 + Math.random() * 12,
      color: COLORS[i % COLORS.length],
    });
  }
  return {
    entities,
    player: { targetX: screenWidth / 2, targetY: screenHeight * 0.75 },
  };
}

const movementSystem: GameSystem<SpikeEntities> = (data, { time }) => {
  const dt = time.delta / 1000;
  for (const e of data.entities) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }
};

const bounceSystem =
  (width: number, height: number): GameSystem<SpikeEntities> =>
  (data) => {
    for (const e of data.entities) {
      if (e.x < 0) {
        e.x = 0;
        e.vx *= -1;
      }
      if (e.x + e.width > width) {
        e.x = width - e.width;
        e.vx *= -1;
      }
      if (e.y < 0) {
        e.y = 0;
        e.vy *= -1;
      }
      if (e.y + e.height > height) {
        e.y = height - e.height;
        e.vy *= -1;
      }
    }
  };

const playerTrackSystem: GameSystem<SpikeEntities> = (data, { time }) => {
  const dt = time.delta / 1000;
  const lerp = Math.min(1, 10 * dt);
  const first = data.entities[0];
  if (first) {
    first.x += (data.player.targetX - first.x - first.width / 2) * lerp;
    first.y += (data.player.targetY - first.y - first.height / 2) * lerp;
    first.vx = 0;
    first.vy = 0;
    first.width = 32;
    first.height = 40;
    first.color = "#00e5ff";
  }
};

// Event-driven HUD update: only updates store every 500ms, not every frame
let lastScoreUpdate = 0;
const hudBridgeSystem: GameSystem<SpikeEntities> = (_data, { time }) => {
  if (time.elapsed - lastScoreUpdate > 500) {
    lastScoreUpdate = time.elapsed;
    useGameSessionStore.getState().addScore(10);
  }
};

export default function GameScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const { width, height } = useWindowDimensions();
  const [running] = useState(true);

  const entitiesRef = useRef<SpikeEntities>(
    createInitialEntities(width, height)
  );

  const renderData = useSharedValue<RenderEntity[]>([]);

  const bounce = useCallback(bounceSystem(width, height), [width, height]);

  const syncToRenderSystem: GameSystem<SpikeEntities> = useCallback(
    (data) => {
      renderData.value = data.entities.map((e) => ({
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        color: e.color,
      }));
    },
    [renderData]
  );

  const systemsRef = useRef<GameSystem<SpikeEntities>[]>([
    movementSystem,
    bounce,
    playerTrackSystem,
    hudBridgeSystem,
    syncToRenderSystem,
  ]);

  useGameLoop(systemsRef, entitiesRef, running);

  const pan = Gesture.Pan().onUpdate((e) => {
    const entities = entitiesRef.current;
    if (entities) {
      entities.player.targetX = e.absoluteX;
      entities.player.targetY = e.absoluteY;
    }
  });

  const tap = Gesture.Tap().onEnd((e) => {
    const entities = entitiesRef.current;
    if (entities) {
      entities.player.targetX = e.absoluteX;
      entities.player.targetY = e.absoluteY;
    }
  });

  const gesture = Gesture.Race(pan, tap);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <GameCanvas renderData={renderData} />
        <HUD />
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.hud}>
            Stage {stageId} | Entities: {ENTITY_COUNT}
          </Text>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a14",
  },
  overlay: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  hud: {
    fontSize: 14,
    color: "#ffffff88",
  },
});
