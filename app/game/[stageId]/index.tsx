import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppState, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useGameLoop, type GameSystem } from '@/engine/GameLoop';
import { GameCanvas, type RenderEntity } from '@/rendering/GameCanvas';
import { HUD } from '@/ui/HUD';
import { PauseMenu } from '@/ui/PauseMenu';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { getStage } from '@/game/stages';
import { getFormDefinition } from '@/game/forms';
import { createGameEntities } from '@/engine/createGameEntities';
import { getScreenMetrics } from '@/constants/dimensions';
import type { GameEntities } from '@/types/entities';
import type { MechaFormId } from '@/types/forms';

// Systems
import { scrollSystem } from '@/engine/systems/ScrollSystem';
import { createMovementSystem } from '@/engine/systems/MovementSystem';
import { createShootingSystem } from '@/engine/systems/ShootingSystem';
import { enemyAISystem } from '@/engine/systems/EnemyAISystem';
import { createSpawnSystem } from '@/engine/systems/SpawnSystem';
import { collisionSystem } from '@/engine/systems/CollisionSystem';
import { gateSystem } from '@/engine/systems/GateSystem';
import { iframeSystem } from '@/engine/systems/IFrameSystem';
import { transformGaugeSystem } from '@/engine/systems/TransformGaugeSystem';
import { awakenedSystem } from '@/engine/systems/AwakenedSystem';
import { bossSystem } from '@/engine/systems/BossSystem';
import { gameOverSystem } from '@/engine/systems/GameOverSystem';
import { createSyncRenderSystem } from '@/engine/systems/SyncRenderSystem';

export default function GameScreen() {
  const { stageId, form, secondary } = useLocalSearchParams<{ stageId: string; form?: string; secondary?: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const stageIdNum = Number(stageId) || 1;

  const stage = getStage(stageIdNum);
  const { scale } = getScreenMetrics(width, height);

  const [running, setRunning] = useState(true);

  // Initialize entities pool with stage metadata
  const entitiesRef = useRef<GameEntities>(
    Object.assign(createGameEntities(width, height), {
      stageDuration: stage.duration,
      isBossStage: stage.isBossStage,
    })
  );

  // SharedValue for Skia rendering
  const renderData = useSharedValue<RenderEntity[]>([]);
  const scrollYShared = useSharedValue(0);

  // Reset session store
  useEffect(() => {
    useGameSessionStore.getState().resetSession(
      stageIdNum,
      (form as MechaFormId) || undefined,
      (secondary as MechaFormId) || undefined,
    );
  }, [stageIdNum, form, secondary]);

  // Watch for game-over or stage-clear
  useEffect(() => {
    const unsub = useGameSessionStore.subscribe((state) => {
      if (state.isGameOver || state.isStageClear) {
        setRunning(false);
        setTimeout(() => {
          router.replace(`/game/${stageIdNum}/result`);
        }, 1000);
      }
    });
    return unsub;
  }, [stageIdNum, router]);

  // Build systems
  const getForm = useCallback(
    () => getFormDefinition(useGameSessionStore.getState().currentForm),
    []
  );

  const systemsRef = useRef<GameSystem<GameEntities>[]>([
    scrollSystem,
    createMovementSystem(getForm),
    createShootingSystem(getForm),
    enemyAISystem,
    createSpawnSystem(stage),
    transformGaugeSystem,
    awakenedSystem,
    collisionSystem,
    gateSystem,
    iframeSystem,
    bossSystem,
    gameOverSystem,
    createSyncRenderSystem(renderData),
  ]);

  useGameLoop(systemsRef, entitiesRef, running);

  // Auto-pause when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        const { isGameOver, isStageClear } = useGameSessionStore.getState();
        if (!isGameOver && !isStageClear) {
          setRunning(false);
          useGameSessionStore.getState().setPaused(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Sync scroll SharedValue for background
  useEffect(() => {
    const interval = setInterval(() => {
      scrollYShared.value = entitiesRef.current?.scrollY ?? 0;
    }, 16);
    return () => clearInterval(interval);
  }, [scrollYShared]);

  // Gesture: drag to move player directly, tap to slide toward position
  // runOnJS(true) is required — without it, RNGH v2 runs callbacks as Reanimated
  // worklets which freezes entitiesRef.current, breaking the game loop.
  const pan = Gesture.Pan().runOnJS(true).minDistance(10)
    .onStart(() => {
      // Cancel any ongoing slide when drag starts
      const entities = entitiesRef.current;
      if (entities) {
        entities.player.targetX = null;
        entities.player.targetY = null;
      }
    })
    .onUpdate((e) => {
      const entities = entitiesRef.current;
      if (!entities) return;
      entities.player.x = e.absoluteX / scale - entities.player.width / 2;
      entities.player.y = e.absoluteY / scale - entities.player.height / 2;
    });

  const tap = Gesture.Tap().runOnJS(true).onEnd((e) => {
    const entities = entitiesRef.current;
    if (!entities) return;
    // Set target — MovementSystem will smoothly slide the player there
    entities.player.targetX = e.absoluteX / scale - entities.player.width / 2;
    entities.player.targetY = e.absoluteY / scale - entities.player.height / 2;
  });

  const gesture = Gesture.Race(pan, tap);

  const [showPauseMenu, setShowPauseMenu] = useState(false);

  // HUD callbacks
  const handlePause = useCallback(() => {
    setRunning(false);
    useGameSessionStore.getState().setPaused(true);
    setShowPauseMenu(true);
  }, []);

  const handleResume = useCallback(() => {
    setShowPauseMenu(false);
    useGameSessionStore.getState().setPaused(false);
    setRunning(true);
  }, []);

  const handleExit = useCallback(() => {
    setShowPauseMenu(false);
    router.replace('/stages');
  }, [router]);

  const handleEXBurst = useCallback(() => {
    const store = useGameSessionStore.getState();
    if (store.exGauge >= 100) {
      // Kill all active enemies
      const entities = entitiesRef.current;
      if (entities) {
        for (const enemy of entities.enemies) {
          if (enemy.active) {
            enemy.hp = 0;
            enemy.active = false;
            store.addScore(100);
          }
        }
      }
      store.addExGauge(-100);
    }
  }, []);

  const handleTransform = useCallback(() => {
    useGameSessionStore.getState().activateTransform();
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <GameCanvas renderData={renderData} scrollY={scrollYShared} scale={scale} />
        </View>
        <HUD
          onPause={handlePause}
          onEXBurst={handleEXBurst}
          onTransform={handleTransform}
          entitiesRef={entitiesRef}
          stageDuration={stage.duration}
        />
        {showPauseMenu && (
          <PauseMenu onResume={handleResume} onExit={handleExit} />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
});
