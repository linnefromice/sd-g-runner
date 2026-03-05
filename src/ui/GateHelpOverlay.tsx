import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '@/constants/colors';

type GateHelpOverlayProps = {
  onClose: () => void;
};

const GATE_INFO = [
  {
    name: 'Enhance',
    color: COLORS.gateEnhance,
    effect: 'Boosts a stat permanently for the stage.',
    examples: 'ATK +5, SPD +10%, Fire Rate +20%',
    combo: 'Combo +1 — build toward Awakening',
  },
  {
    name: 'Recovery',
    color: COLORS.gateRecovery,
    effect: 'Restores HP by a flat amount or percentage.',
    examples: 'HP +20, HP +30, HP +50%',
    combo: 'No effect on combo',
  },
  {
    name: 'Tradeoff',
    color: COLORS.gateTradeoff,
    effect: 'Raises one stat but lowers another.',
    examples: 'ATK↑ SPD↓, SPD↑ ATK↓, FR↑ ATK↓',
    combo: 'Resets combo to 0',
  },
  {
    name: 'Refit',
    color: COLORS.gateRefit,
    effect: 'Switches your mecha to a different form.',
    examples: '→ Heavy Artillery, → High Speed',
    combo: 'Resets combo to 0',
  },
] as const;

function GateHelpOverlayInner({ onClose }: GateHelpOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>GATE TYPES</Text>

        <ScrollView style={styles.list}>
          {GATE_INFO.map((gate) => (
            <View key={gate.name} style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: gate.color }]} />
              <View style={styles.info}>
                <Text style={[styles.gateName, { color: gate.color }]}>{gate.name}</Text>
                <Text style={styles.effect}>{gate.effect}</Text>
                <Text style={styles.examples}>{gate.examples}</Text>
                <Text style={styles.combo}>{gate.combo}</Text>
              </View>
            </View>
          ))}

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>TIP</Text>
            <Text style={styles.tipText}>
              3 consecutive Enhance gates triggers Awakened form (10s) — 2x ATK, homing shots, invincible!
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const GateHelpOverlay = React.memo(GateHelpOverlayInner);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1a1a2eee',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
    letterSpacing: 2,
  },
  list: {
    width: '100%',
    maxHeight: 380,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  swatch: {
    width: 12,
    height: 40,
    borderRadius: 4,
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  gateName: {
    fontSize: 16,
    fontWeight: '700',
  },
  effect: {
    fontSize: 13,
    color: COLORS.white,
    marginTop: 2,
  },
  examples: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  combo: {
    fontSize: 12,
    color: COLORS.scoreYellow,
    fontStyle: 'italic',
    marginTop: 2,
  },
  tipBox: {
    backgroundColor: COLORS.neonBlue + '11',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
    marginTop: 4,
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.lightGray,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: COLORS.neonBlue + '33',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '66',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
