import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { FORM_DEFINITIONS } from '@/game/forms';
import { FORM_UNLOCK_CONDITIONS, canUnlockForm } from '@/game/upgrades';
import { COLORS } from '@/constants/colors';
import type { MechaFormId } from '@/types/forms';

const SELECTABLE_FORMS: MechaFormId[] = [
  'SD_Standard',
  'SD_HeavyArtillery',
  'SD_HighSpeed',
];

const ABILITY_LABELS: Record<string, string> = {
  none: '-',
  explosion_radius: 'Explosion',
  pierce: 'Pierce',
  homing_invincible: 'Homing + Invincible',
};

export default function SelectFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stageIdNum = Number(id) || 1;

  const unlockedForms = useSaveDataStore((s) => s.unlockedForms);
  const unlockedStages = useSaveDataStore((s) => s.unlockedStages);
  const credits = useSaveDataStore((s) => s.credits);

  const handleSelect = (formId: MechaFormId) => {
    router.push(`/game/${stageIdNum}?form=${formId}`);
  };

  const handleUnlock = (formId: MechaFormId) => {
    const cond = FORM_UNLOCK_CONDITIONS[formId];
    if (cond.type !== 'unlock') return;
    const store = useSaveDataStore.getState();
    if (store.spendCredits(cond.cost)) {
      store.unlockForm(formId);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Form</Text>
        <Text style={styles.subtitle}>Stage {stageIdNum}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SELECTABLE_FORMS.map((formId) => {
          const form = FORM_DEFINITIONS[formId];
          const isUnlocked = unlockedForms.includes(formId);
          const cond = FORM_UNLOCK_CONDITIONS[formId];
          const canBuy = !isUnlocked && canUnlockForm(formId, unlockedStages, credits);

          return (
            <View key={formId} style={[styles.formCard, !isUnlocked && styles.formCardLocked]}>
              <View style={styles.formHeader}>
                <View
                  style={[styles.formColor, { backgroundColor: form.spriteConfig.bodyColor }]}
                />
                <Text style={[styles.formName, !isUnlocked && styles.textLocked]}>
                  {form.displayName}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <StatItem label="ATK" value={`${Math.round(form.attackMultiplier * 100)}%`} locked={!isUnlocked} />
                <StatItem label="SPD" value={`${Math.round(form.moveSpeedMultiplier * 100)}%`} locked={!isUnlocked} />
                <StatItem label="RATE" value={`${Math.round(form.fireRateMultiplier * 100)}%`} locked={!isUnlocked} />
              </View>

              {isUnlocked && (
                <Text style={styles.ability}>
                  {ABILITY_LABELS[form.specialAbility] ?? form.specialAbility}
                </Text>
              )}

              {isUnlocked ? (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleSelect(formId)}
                >
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              ) : cond.type === 'unlock' ? (
                <View style={styles.unlockRow}>
                  <Text style={styles.unlockCondition}>
                    Stage {cond.requiredStage} Clear + {cond.cost} Cr
                  </Text>
                  <TouchableOpacity
                    style={[styles.unlockButton, !canBuy && styles.unlockButtonDisabled]}
                    disabled={!canBuy}
                    onPress={() => handleUnlock(formId)}
                  >
                    <Text style={styles.unlockButtonText}>Unlock</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })}

        <View style={[styles.formCard, styles.formCardLocked]}>
          <View style={styles.formHeader}>
            <View
              style={[styles.formColor, { backgroundColor: FORM_DEFINITIONS.SD_Awakened.spriteConfig.bodyColor }]}
            />
            <Text style={styles.formName}>Awakened</Text>
          </View>
          <Text style={styles.comboOnly}>Activated via Combo (3 consecutive enhance gates)</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/stages')}>
        <Text style={styles.backButtonText}>Back to Stages</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatItem({ label, value, locked }: { label: string; value: string; locked: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statLabel, locked && styles.textLocked]}>{label}</Text>
      <Text style={[styles.statValue, locked && styles.textLocked]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 4,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 16,
  },
  formCard: {
    backgroundColor: '#ffffff11',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
  },
  formCardLocked: {
    backgroundColor: '#ffffff06',
    borderColor: '#ffffff11',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  formName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: { alignItems: 'center' },
  statLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
  },
  ability: {
    fontSize: 12,
    color: COLORS.neonGreen,
    marginBottom: 12,
  },
  textLocked: { color: '#555555' },
  selectButton: {
    backgroundColor: COLORS.neonBlue + '33',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neonBlue,
  },
  unlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  unlockCondition: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  unlockButton: {
    backgroundColor: COLORS.scoreYellow + '33',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  unlockButtonDisabled: { opacity: 0.3 },
  unlockButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.scoreYellow,
  },
  comboOnly: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontStyle: 'italic',
  },
  backButton: {
    marginHorizontal: 24,
    marginBottom: 40,
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
