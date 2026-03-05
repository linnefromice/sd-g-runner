import { useGameSessionStore } from '@/stores/gameSessionStore';
import { TRANSFORM_GAUGE_MAX } from '@/constants/balance';

describe('Transform system store logic', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession(1, 'SD_Standard', 'SD_HeavyArtillery');
  });

  test('resetSession sets primaryForm and secondaryForm', () => {
    const state = useGameSessionStore.getState();
    expect(state.currentForm).toBe('SD_Standard');
    expect(state.primaryForm).toBe('SD_Standard');
    expect(state.secondaryForm).toBe('SD_HeavyArtillery');
    expect(state.transformGauge).toBe(0);
  });

  test('resetSession defaults secondaryForm to SD_HeavyArtillery', () => {
    useGameSessionStore.getState().resetSession(1, 'SD_Standard');
    const state = useGameSessionStore.getState();
    expect(state.secondaryForm).toBe('SD_HeavyArtillery');
  });

  test('addTransformGauge increases gauge', () => {
    useGameSessionStore.getState().addTransformGauge(30);
    expect(useGameSessionStore.getState().transformGauge).toBe(30);
  });

  test('addTransformGauge clamps at MAX', () => {
    useGameSessionStore.getState().addTransformGauge(150);
    expect(useGameSessionStore.getState().transformGauge).toBe(TRANSFORM_GAUGE_MAX);
  });

  test('activateTransform switches to secondary form', () => {
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateTransform();
    const state = useGameSessionStore.getState();
    expect(state.currentForm).toBe('SD_HeavyArtillery');
    expect(state.transformGauge).toBe(0);
  });

  test('activateTransform toggles back to primary form', () => {
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateTransform();
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateTransform();
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Standard');
  });

  test('activateTransform does nothing when gauge not full', () => {
    useGameSessionStore.getState().addTransformGauge(50);
    useGameSessionStore.getState().activateTransform();
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Standard');
    expect(useGameSessionStore.getState().transformGauge).toBe(50);
  });

  test('activateTransform does nothing when awakened', () => {
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateAwakened();
    useGameSessionStore.getState().activateTransform();
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Awakened');
  });
});
