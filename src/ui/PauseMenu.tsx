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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1a1a2eee',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.neonBlue + '33',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '66',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  exitButton: {
    backgroundColor: '#ff336622',
    borderColor: '#ff336666',
  },
  exitText: {
    color: COLORS.neonRed,
  },
});
