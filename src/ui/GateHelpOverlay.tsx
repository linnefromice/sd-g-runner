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
    effect: 'Boosts a stat (ATK, Speed, or Fire Rate)',
    combo: 'Combo +1',
  },
  {
    name: 'Recovery',
    color: COLORS.gateRecovery,
    effect: 'Restores HP',
    combo: 'No combo change',
  },
  {
    name: 'Tradeoff',
    color: COLORS.gateTradeoff,
    effect: 'Raises one stat, lowers another',
    combo: 'Combo reset',
  },
  {
    name: 'Refit',
    color: COLORS.gateRefit,
    effect: 'Changes mecha form',
    combo: 'Combo reset',
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
                <Text style={styles.combo}>{gate.combo}</Text>
              </View>
            </View>
          ))}
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
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  swatch: {
    width: 12,
    height: 40,
    borderRadius: 4,
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
    color: COLORS.lightGray,
    marginTop: 2,
  },
  combo: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontStyle: 'italic',
    marginTop: 1,
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
