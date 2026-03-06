import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { COLORS } from '@/constants/colors';
import { EX_GAUGE_MAX, COMBO_THRESHOLD, TRANSFORM_GAUGE_MAX } from '@/constants/balance';
import { useTranslation } from '@/i18n';
import type { GameEntities } from '@/types/entities';
import type { MechaFormId } from '@/types/forms';

function HPBar() {
  const hp = useGameSessionStore((s) => s.hp);
  const maxHp = useGameSessionStore((s) => s.maxHp);
  const ratio = maxHp > 0 ? hp / maxHp : 0;

  return (
    <View style={styles.hpContainer}>
      <View style={styles.hpTrack}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: ratio > 0.3 ? COLORS.hpHealthy : COLORS.hpCritical,
            },
          ]}
        />
      </View>
      <Text style={styles.hpText}>
        {hp}/{maxHp}
      </Text>
    </View>
  );
}

function ScoreDisplay() {
  const score = useGameSessionStore((s) => s.score);
  return <Text style={styles.score}>{score.toLocaleString()}</Text>;
}

function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
      <Text style={styles.pauseIcon}>||</Text>
    </TouchableOpacity>
  );
}

function FormIndicator() {
  const form = useGameSessionStore((s) => s.currentForm);
  const t = useTranslation();
  const formId = form as MechaFormId;
  const name = t.forms[formId] ?? form.replace('SD_', '');
  return (
    <View style={styles.formBadge}>
      <Text style={styles.formText}>{name}</Text>
    </View>
  );
}

function ComboGauge() {
  const comboCount = useGameSessionStore((s) => s.comboCount);
  const isAwakened = useGameSessionStore((s) => s.isAwakened);
  const awakenedWarning = useGameSessionStore((s) => s.awakenedWarning);
  const t = useTranslation();

  if (isAwakened) {
    return (
      <View style={styles.comboContainer}>
        <Text
          style={[
            styles.comboText,
            { color: awakenedWarning ? COLORS.hpCritical : COLORS.scoreYellow },
          ]}
        >
          {awakenedWarning ? t.hud.fading : t.hud.awakened}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.comboContainer}>
      {Array.from({ length: COMBO_THRESHOLD }, (_, i) => {
        const isLit = i < comboCount;
        return (
          <View
            key={i}
            style={[
              styles.comboSegment,
              {
                backgroundColor: isLit ? COLORS.neonGreen : '#333',
                borderColor: isLit ? COLORS.neonGreen : '#555',
                shadowColor: isLit ? COLORS.neonGreen : 'transparent',
                shadowOpacity: isLit ? 0.8 : 0,
                shadowRadius: isLit ? 4 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function EXGaugeBar() {
  const exGauge = useGameSessionStore((s) => s.exGauge);
  const ratio = exGauge / EX_GAUGE_MAX;
  const isFull = exGauge >= EX_GAUGE_MAX;

  return (
    <View style={styles.exContainer}>
      <View style={styles.exTrack}>
        <View
          style={[
            styles.exFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: isFull ? COLORS.scoreYellow : COLORS.neonBlue,
            },
          ]}
        />
      </View>
      <Text style={styles.exLabel}>EX</Text>
    </View>
  );
}

function EXButton({ onActivate }: { onActivate: () => void }) {
  const exGauge = useGameSessionStore((s) => s.exGauge);
  const isFull = exGauge >= EX_GAUGE_MAX;

  return (
    <TouchableOpacity
      style={[styles.exButton, isFull && styles.exButtonActive]}
      onPress={onActivate}
      disabled={!isFull}
    >
      <Text style={[styles.exButtonText, isFull && styles.exButtonTextActive]}>EX</Text>
    </TouchableOpacity>
  );
}

function TransformGaugeBar() {
  const transformGauge = useGameSessionStore((s) => s.transformGauge);
  const ratio = transformGauge / TRANSFORM_GAUGE_MAX;
  const isFull = transformGauge >= TRANSFORM_GAUGE_MAX;

  return (
    <View style={styles.transformContainer}>
      <View style={styles.transformTrack}>
        <View
          style={[
            styles.transformFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: isFull ? COLORS.neonGreen : COLORS.neonPink,
            },
          ]}
        />
      </View>
      <Text style={styles.transformLabel}>TF</Text>
    </View>
  );
}

function TransformButton({ onActivate }: { onActivate: () => void }) {
  const transformGauge = useGameSessionStore((s) => s.transformGauge);
  const isAwakened = useGameSessionStore((s) => s.isAwakened);
  const isFull = transformGauge >= TRANSFORM_GAUGE_MAX;
  const canTransform = isFull && !isAwakened;

  return (
    <TouchableOpacity
      style={[styles.transformButton, canTransform && styles.transformButtonActive]}
      onPress={onActivate}
      disabled={!canTransform}
    >
      <Text style={[styles.transformButtonText, canTransform && styles.transformButtonTextActive]}>
        TF
      </Text>
    </TouchableOpacity>
  );
}

function StageProgressBar({
  entitiesRef,
  stageDuration,
}: {
  entitiesRef: React.RefObject<GameEntities>;
  stageDuration: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const stageTime = entitiesRef.current?.stageTime ?? 0;
      setProgress(stageDuration > 0 ? Math.min(1, stageTime / stageDuration) : 0);
    }, 250); // Update 4x/sec — sufficient for a progress bar
    return () => clearInterval(interval);
  }, [entitiesRef, stageDuration]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` as `${number}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{Math.floor(progress * 100)}%</Text>
    </View>
  );
}

type HUDProps = {
  onPause: () => void;
  onEXBurst: () => void;
  onTransform: () => void;
  entitiesRef: React.RefObject<GameEntities>;
  stageDuration: number;
};

function HUDInner({ onPause, onEXBurst, onTransform, entitiesRef, stageDuration }: HUDProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingBottom: Math.max(insets.bottom, 12) + 8,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Top section */}
      <View>
        {/* Stage progress bar */}
        <StageProgressBar entitiesRef={entitiesRef} stageDuration={stageDuration} />
        {/* Pause, HP, Score */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <PauseButton onPause={onPause} />
            <HPBar />
          </View>
          <ScoreDisplay />
        </View>
      </View>

      {/* Bottom area: Form icon, Combo, EX */}
      <View style={styles.bottomArea}>
        <FormIndicator />
        <View style={styles.bottomRight}>
          <ComboGauge />
          <View style={styles.buttonRow}>
            <TransformButton onActivate={onTransform} />
            <EXButton onActivate={onEXBurst} />
          </View>
          <TransformGaugeBar />
          <EXGaugeBar />
        </View>
      </View>
    </View>
  );
}

export const HUD = React.memo(HUDInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.neonBlue,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#888',
    fontVariant: ['tabular-nums'],
    width: 30,
    textAlign: 'right',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hpTrack: {
    width: 100,
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpFill: { height: '100%', borderRadius: 4 },
  hpText: { fontSize: 11, color: '#ffffffcc', fontVariant: ['tabular-nums'] },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.scoreYellow,
    fontVariant: ['tabular-nums'],
  },
  pauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: { fontSize: 16, color: '#fff' },
  bottomArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomRight: { alignItems: 'flex-end', gap: 6 },
  formBadge: {
    backgroundColor: '#ffffff22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  formText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  comboContainer: { flexDirection: 'row', gap: 4 },
  comboSegment: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#555',
  },
  comboText: { fontSize: 12, fontWeight: 'bold' },
  exContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exTrack: {
    width: 80,
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  exFill: { height: '100%', borderRadius: 3 },
  exLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  exButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  exButtonActive: {
    backgroundColor: COLORS.scoreYellow,
    borderColor: '#fff',
  },
  exButtonText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  exButtonTextActive: { color: '#000' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  transformContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transformTrack: {
    width: 80,
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  transformFill: { height: '100%', borderRadius: 3 },
  transformLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  transformButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  transformButtonActive: {
    backgroundColor: COLORS.neonGreen,
    borderColor: '#fff',
  },
  transformButtonText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  transformButtonTextActive: { color: '#000' },
});
