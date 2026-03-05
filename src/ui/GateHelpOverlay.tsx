import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '@/constants/colors';
import { useTranslation } from '@/i18n';

type GateHelpOverlayProps = {
  onClose: () => void;
};

const GATE_KEYS = ['enhance', 'recovery', 'tradeoff', 'refit'] as const;

const GATE_COLORS: Record<typeof GATE_KEYS[number], string> = {
  enhance: COLORS.gateEnhance,
  recovery: COLORS.gateRecovery,
  tradeoff: COLORS.gateTradeoff,
  refit: COLORS.gateRefit,
};

function GateHelpOverlayInner({ onClose }: GateHelpOverlayProps) {
  const t = useTranslation();

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{t.gateHelp.title}</Text>

        <ScrollView style={styles.list}>
          {GATE_KEYS.map((key) => {
            const gate = t.gateHelp[key];
            const color = GATE_COLORS[key];
            return (
              <View key={key} style={styles.row}>
                <View style={[styles.swatch, { backgroundColor: color }]} />
                <View style={styles.info}>
                  <Text style={[styles.gateName, { color }]}>{gate.name}</Text>
                  <Text style={styles.effect}>{gate.effect}</Text>
                  <Text style={styles.examples}>{gate.examples}</Text>
                  <Text style={styles.combo}>{gate.combo}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>{t.gateHelp.tip}</Text>
            <Text style={styles.tipText}>{t.gateHelp.tipText}</Text>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>{t.gateHelp.close}</Text>
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
