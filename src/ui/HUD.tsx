import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { COLORS } from '@/constants/colors';
import { EX_GAUGE_MAX, COMBO_THRESHOLD } from '@/constants/balance';

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
  const name = form.replace('SD_', '');
  return (
    <View style={styles.formBadge}>
      <Text style={styles.formText}>{name}</Text>
    </View>
  );
}

function ComboGauge() {
  const comboCount = useGameSessionStore((s) => s.comboCount);
  const isAwakened = useGameSessionStore((s) => s.isAwakened);

  if (isAwakened) {
    return (
      <View style={styles.comboContainer}>
        <Text style={[styles.comboText, { color: COLORS.scoreYellow }]}>AWAKENED</Text>
      </View>
    );
  }

  return (
    <View style={styles.comboContainer}>
      {Array.from({ length: COMBO_THRESHOLD }, (_, i) => (
        <View
          key={i}
          style={[
            styles.comboSegment,
            {
              backgroundColor: i < comboCount ? COLORS.neonGreen : '#333',
            },
          ]}
        />
      ))}
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

type HUDProps = {
  onPause: () => void;
  onEXBurst: () => void;
};

function HUDInner({ onPause, onEXBurst }: HUDProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top row: Pause, HP, Score */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <PauseButton onPause={onPause} />
          <HPBar />
        </View>
        <ScoreDisplay />
      </View>

      {/* Bottom area: Form icon, Combo, EX */}
      <View style={styles.bottomArea}>
        <FormIndicator />
        <View style={styles.bottomRight}>
          <ComboGauge />
          <EXButton onActivate={onEXBurst} />
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
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
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
});
