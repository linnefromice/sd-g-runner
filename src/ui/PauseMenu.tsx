import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useTranslation } from '@/i18n';
import { GateHelpOverlay } from '@/ui/GateHelpOverlay';

type PauseMenuProps = {
  onResume: () => void;
  onExit: () => void;
};

function PauseMenuInner({ onResume, onExit }: PauseMenuProps) {
  const insets = useSafeAreaInsets();
  const [showGateHelp, setShowGateHelp] = useState(false);
  const t = useTranslation();

  if (showGateHelp) {
    return <GateHelpOverlay onClose={() => setShowGateHelp(false)} />;
  }

  return (
    <View style={[styles.overlay, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.card}>
        <Text style={styles.title}>{t.hud.paused}</Text>
        <View style={styles.titleLine} />

        <TouchableOpacity style={styles.button} onPress={onResume}>
          <Text style={styles.buttonText}>{t.hud.resume}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => setShowGateHelp(true)}>
          <Text style={styles.buttonText}>{t.hud.gateHelp}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.exitButton]} onPress={onExit}>
          <Text style={[styles.buttonText, styles.exitText]}>{t.hud.exitStage}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const PauseMenu = React.memo(PauseMenuInner);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0a0a14ee',
    borderRadius: 2,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    minWidth: 240,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  titleLine: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.neonBlue + '44',
    marginBottom: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 2,
    backgroundColor: COLORS.neonBlue + '18',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '55',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.neonBlue,
    letterSpacing: 1,
  },
  exitButton: {
    backgroundColor: '#ff336618',
    borderColor: '#ff336655',
  },
  exitText: {
    color: COLORS.neonRed,
  },
});
