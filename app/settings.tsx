import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const bgmVolume = useSaveDataStore((s) => s.settings.bgmVolume);
  const seVolume = useSaveDataStore((s) => s.settings.seVolume);
  const locale = useSaveDataStore((s) => s.settings.locale);
  const hapticsEnabled = useSaveDataStore((s) => s.settings.hapticsEnabled);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.settings.title}</Text>
      <View style={styles.titleLine} />

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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t.settings.haptics}</Text>
        </View>
        <View style={styles.steps}>
          <TouchableOpacity
            style={[styles.step, hapticsEnabled && styles.stepActive]}
            onPress={() => useSaveDataStore.getState().setHapticsEnabled(true)}
          >
            <Text style={[styles.stepText, hapticsEnabled && styles.stepTextActive]}>
              {t.settings.hapticsOn}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.step, !hapticsEnabled && styles.stepActive]}
            onPress={() => useSaveDataStore.getState().setHapticsEnabled(false)}
          >
            <Text style={[styles.stepText, !hapticsEnabled && styles.stepTextActive]}>
              {t.settings.hapticsOff}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t.settings.language}</Text>
        </View>
        <View style={styles.steps}>
          {LOCALE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.step, locale === opt.value && styles.stepActive]}
              onPress={() => useSaveDataStore.getState().setLocale(opt.value)}
            >
              <Text style={[styles.stepText, locale === opt.value && styles.stepTextActive]}>
                {t.settings[opt.labelKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.backButton, { marginBottom: Math.max(insets.bottom, 24) }]}
        onPress={() => router.push('/')}
      >
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <Text style={styles.sectionValue}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.steps}>
        {VOLUME_STEPS.map((step) => (
          <TouchableOpacity
            key={step}
            style={[styles.step, value === step && styles.stepActive]}
            onPress={() => onChange(step)}
          >
            <Text style={[styles.stepText, value === step && styles.stepTextActive]}>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  titleLine: {
    height: 1,
    backgroundColor: COLORS.neonBlue + '33',
    marginTop: 12,
    marginBottom: 32,
  },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionValue: {
    fontSize: 14,
    color: COLORS.neonBlue,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  steps: {
    flexDirection: 'row',
    gap: 6,
  },
  step: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 2,
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderWidth: 1,
    borderColor: '#ffffff18',
  },
  stepActive: {
    backgroundColor: COLORS.neonBlue + '22',
    borderColor: COLORS.neonBlue,
  },
  stepText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  stepTextActive: {
    color: COLORS.neonBlue,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#ffffff08',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
