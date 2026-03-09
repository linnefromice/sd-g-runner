import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { FORM_DEFINITIONS } from '@/game/forms';
import { FORM_XP_THRESHOLDS } from '@/constants/balance';

const FORM_SHORT_NAMES: Record<string, string> = {
  SD_Standard: 'STD',
  SD_HeavyArtillery: 'HVY',
  SD_HighSpeed: 'SPD',
  SD_Sniper: 'SNP',
  SD_Scatter: 'SCT',
  SD_Awakened: 'AWK',
};

export function FormXPBar() {
  const currentForm = useGameSessionStore((s) => s.currentForm);
  const formXPState = useGameSessionStore((s) => s.formXP[s.currentForm]);

  // Don't show for Awakened form
  if (currentForm === 'SD_Awakened' || !formXPState) return null;

  const formDef = FORM_DEFINITIONS[currentForm];
  const barColor = formDef?.spriteConfig.bodyColor ?? '#00D4FF';
  const shortName = FORM_SHORT_NAMES[currentForm] ?? '???';

  const level = formXPState.level;
  const xp = formXPState.xp;
  // If max level, show full bar
  const threshold = level < 3 ? FORM_XP_THRESHOLDS[level] : FORM_XP_THRESHOLDS[2];
  const prevThreshold = level > 0 ? FORM_XP_THRESHOLDS[level - 1] : 0;
  const progress = level >= 3 ? 1 : Math.min(1, (xp - prevThreshold) / (threshold - prevThreshold));

  const skillCount = formXPState.skills.length;

  return (
    <View style={styles.container}>
      <Text style={[styles.formName, { color: barColor }]}>{shortName}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${progress * 100}%` as `${number}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={styles.levelText}>Lv{level}</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < skillCount
                ? { backgroundColor: barColor }
                : { borderColor: barColor, borderWidth: 1 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    gap: 4,
  },
  formName: {
    fontSize: 9,
    fontWeight: 'bold',
    width: 24,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelText: {
    fontSize: 9,
    color: '#AAAAAA',
    width: 20,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
