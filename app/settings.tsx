import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { COLORS } from '@/constants/colors';

const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1.0];

export default function SettingsScreen() {
  const router = useRouter();
  const bgmVolume = useSaveDataStore((s) => s.settings.bgmVolume);
  const seVolume = useSaveDataStore((s) => s.settings.seVolume);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <VolumeControl
        label="BGM Volume"
        value={bgmVolume}
        onChange={(v) => useSaveDataStore.getState().setVolume('bgm', v)}
      />

      <VolumeControl
        label="SE Volume"
        value={seVolume}
        onChange={(v) => useSaveDataStore.getState().setVolume('se', v)}
      />

      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
        <Text style={styles.backButtonText}>Back to Title</Text>
      </TouchableOpacity>
    </View>
  );
}

function VolumeControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.volumeSection}>
      <View style={styles.volumeHeader}>
        <Text style={styles.volumeLabel}>{label}</Text>
        <Text style={styles.volumeValue}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.volumeSteps}>
        {VOLUME_STEPS.map((step) => (
          <TouchableOpacity
            key={step}
            style={[styles.volumeStep, value === step && styles.volumeStepActive]}
            onPress={() => onChange(step)}
          >
            <Text style={[styles.volumeStepText, value === step && styles.volumeStepTextActive]}>
              {Math.round(step * 100)}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    marginBottom: 40,
  },
  volumeSection: { marginBottom: 32 },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  volumeLabel: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
  volumeValue: {
    fontSize: 14,
    color: COLORS.neonBlue,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  volumeSteps: {
    flexDirection: 'row',
    gap: 8,
  },
  volumeStep: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff11',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  volumeStepActive: {
    backgroundColor: COLORS.neonBlue + '33',
    borderColor: COLORS.neonBlue,
  },
  volumeStepText: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: '600',
  },
  volumeStepTextActive: {
    color: COLORS.neonBlue,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#ffffff22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
  },
});
