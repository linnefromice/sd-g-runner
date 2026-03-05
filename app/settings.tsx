import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { useTranslation, type LocaleSetting } from '@/i18n';
import { COLORS } from '@/constants/colors';

const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1.0];

const LOCALE_OPTIONS: { value: LocaleSetting; labelKey: 'localeSystem' | 'localeEn' | 'localeJa' }[] = [
  { value: 'system', labelKey: 'localeSystem' },
  { value: 'en', labelKey: 'localeEn' },
  { value: 'ja', labelKey: 'localeJa' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const bgmVolume = useSaveDataStore((s) => s.settings.bgmVolume);
  const seVolume = useSaveDataStore((s) => s.settings.seVolume);
  const locale = useSaveDataStore((s) => s.settings.locale);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.settings.title}</Text>

      <VolumeControl
        label={t.settings.bgmVolume}
        value={bgmVolume}
        onChange={(v) => useSaveDataStore.getState().setVolume('bgm', v)}
      />

      <VolumeControl
        label={t.settings.seVolume}
        value={seVolume}
        onChange={(v) => useSaveDataStore.getState().setVolume('se', v)}
      />

      <View style={styles.volumeSection}>
        <View style={styles.volumeHeader}>
          <Text style={styles.volumeLabel}>{t.settings.language}</Text>
        </View>
        <View style={styles.volumeSteps}>
          {LOCALE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.volumeStep, locale === opt.value && styles.volumeStepActive]}
              onPress={() => useSaveDataStore.getState().setLocale(opt.value)}
            >
              <Text style={[styles.volumeStepText, locale === opt.value && styles.volumeStepTextActive]}>
                {t.settings[opt.labelKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/')}>
        <Text style={styles.backButtonText}>{t.settings.backToTitle}</Text>
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
