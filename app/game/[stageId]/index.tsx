import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppState, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useGameLoop, type GameSystem } from '@/engine/GameLoop';
import { GameCanvas, type RenderEntity } from '@/rendering/GameCanvas';
import type { PopupRenderData, OverlayState } from '@/engine/systems/SyncRenderSystem';
import { HUD } from '@/ui/HUD';
import { PauseMenu } from '@/ui/PauseMenu';
import { SkillChoiceOverlay } from '@/ui/SkillChoiceOverlay';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { getStage } from '@/game/stages';
import { getFormDefinition } from '@/game/forms';
import { createGameEntities } from '@/engine/createGameEntities';
import { getScreenMetrics } from '@/constants/dimensions';
import { JUST_TF_WINDOW } from '@/constants/balance';
import type { GameEntities } from '@/types/entities';
import type { MechaFormId } from '@/types/forms';
import { onEXBurst } from '@/engine/effects';
import { AudioManager } from '@/audio/AudioManager';
import { HapticsManager } from '@/audio/HapticsManager';

// Systems
import { scrollSystem } from '@/engine/systems/ScrollSystem';
import { boostLaneSystem } from '@/engine/systems/BoostLaneSystem';
import { createMovementSystem } from '@/engine/systems/MovementSystem';
import { createShootingSystem } from '@/engine/systems/ShootingSystem';
import { createEnemyAISystem } from '@/engine/systems/EnemyAISystem';
import { createSpawnSystem, createEndlessSpawnSystem } from '@/engine/systems/SpawnSystem';
import { collisionSystem } from '@/engine/systems/CollisionSystem';
import { gateSystem } from '@/engine/systems/GateSystem';
import { iframeSystem } from '@/engine/systems/IFrameSystem';
import { transformGaugeSystem } from '@/engine/systems/TransformGaugeSystem';
import { awakenedSystem } from '@/engine/systems/AwakenedSystem';
import { exBurstSystem } from '@/engine/systems/EXBurstSystem';
import { createBossSystem } from '@/engine/systems/BossSystem';
import { gameOverSystem } from '@/engine/systems/GameOverSystem';
import { particleSystem } from '@/engine/systems/ParticleSystem';
import { screenShakeSystem } from '@/engine/systems/ScreenShakeSystem';
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
  const popupData = useSharedValue<PopupRenderData[]>([]);
  const scrollYShared = useSharedValue(0);
  const overlayState = useSharedValue<OverlayState>({ dangerOpacity: 0, bossPhaseOpacity: 0, awakenedOpacity: 0, gateFlashOpacity: 0, gateFlashColor: '#FFFFFF', exFlashOpacity: 0, bossEntranceOpacity: 0 });

  // Reset session store
  useEffect(() => {
    useGameSessionStore.getState().resetSession(
      stageIdNum,
      (form as MechaFormId) || undefined,
      (secondary as MechaFormId) || undefined,
    );
  }, [stageIdNum, form, secondary]);

  // BGM management
  useEffect(() => {
    AudioManager.playBgm('stage');
    return () => {
      AudioManager.stopBgm();
    };
  }, []);

  // Watch for game-over or stage-clear
  useEffect(() => {
    const unsub = useGameSessionStore.subscribe((state) => {
      if (state.isGameOver || state.isStageClear) {
        setRunning(false);
        // Save endless mode records
        if (stageIdNum === 99) {
          const saveStore = useSaveDataStore.getState();
          const session = useGameSessionStore.getState();
          saveStore.updateEndlessRecord(session.finalStageTime, session.score);
          if (session.finalStageTime >= 300) {
            saveStore.unlockAchievement('endless_survivor');
          }
        }
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
    boostLaneSystem,
    createMovementSystem(getForm),
    createShootingSystem(getForm),
    createEnemyAISystem(stage.difficulty),
    stageIdNum === 99 ? createEndlessSpawnSystem() : createSpawnSystem(stage),
    transformGaugeSystem,
    awakenedSystem,
    exBurstSystem,
    collisionSystem,
    gateSystem,
    iframeSystem,
    createBossSystem(),
    gameOverSystem,
    particleSystem,
    screenShakeSystem,
    createSyncRenderSystem(renderData, popupData, scrollYShared, overlayState, scale),
  ]);

  // Pause game loop during skill choice overlay
  const pendingChoice = useGameSessionStore((s) => s.pendingSkillChoice);
  const effectiveRunning = running && pendingChoice === null;

  useGameLoop(systemsRef, entitiesRef, effectiveRunning);

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
    useGameSessionStore.getState().activateEXBurst();
    AudioManager.playSe('exBurst');
    HapticsManager.exBurst();
    const p = entitiesRef.current.player;
    onEXBurst(entitiesRef.current, p.x + p.width / 2, p.y);
  }, []);

  const handleTransform = useCallback(() => {
    const activated = useGameSessionStore.getState().activateTransform();
    if (activated) {
      entitiesRef.current.justTFTimer = JUST_TF_WINDOW;
    }
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <GameCanvas renderData={renderData} popupData={popupData} scrollY={scrollYShared} overlayState={overlayState} scale={scale} />
        </View>
        <HUD
          onPause={handlePause}
          onEXBurst={handleEXBurst}
          onTransform={handleTransform}
          entitiesRef={entitiesRef}
          stageDuration={stage.duration}
        />
        <SkillChoiceOverlay />
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
