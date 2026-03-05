import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { FORM_DEFINITIONS, FORM_DISPLAY_KEY } from '@/game/forms';
import { FORM_UNLOCK_CONDITIONS, canUnlockForm } from '@/game/upgrades';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/constants/colors';
import type { MechaFormId } from '@/types/forms';

const SELECTABLE_FORMS: MechaFormId[] = [
  'SD_Standard',
  'SD_HeavyArtillery',
  'SD_HighSpeed',
];

export default function SelectFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const stageIdNum = Number(id) || 1;
  const t = useTranslation();

  const insets = useSafeAreaInsets();
  const unlockedForms = useSaveDataStore((s) => s.unlockedForms);
  const unlockedStages = useSaveDataStore((s) => s.unlockedStages);
  const credits = useSaveDataStore((s) => s.credits);

  const [primaryForm, setPrimaryForm] = useState<MechaFormId | null>(null);
  const [secondaryForm, setSecondaryForm] = useState<MechaFormId | null>(null);

  const handleFormTap = (formId: MechaFormId) => {
    if (primaryForm === null) {
      setPrimaryForm(formId);
    } else if (primaryForm === formId) {
      setPrimaryForm(secondaryForm);
      setSecondaryForm(null);
    } else if (secondaryForm === formId) {
      setSecondaryForm(null);
    } else if (secondaryForm === null) {
      setSecondaryForm(formId);
    } else {
      setSecondaryForm(formId);
    }
  };

  const handleStart = () => {
    if (primaryForm && secondaryForm) {
      router.push(`/game/${stageIdNum}?form=${primaryForm}&secondary=${secondaryForm}`);
    }
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
        <Text style={styles.title}>{t.selectForm.title}</Text>
        <Text style={styles.subtitle}>{t.selectForm.stage} {stageIdNum}</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SELECTABLE_FORMS.map((formId) => {
          const form = FORM_DEFINITIONS[formId];
          const isUnlocked = unlockedForms.includes(formId);
          const cond = FORM_UNLOCK_CONDITIONS[formId];
          const canBuy = !isUnlocked && canUnlockForm(formId, unlockedStages, credits);
          const formName = t.forms[FORM_DISPLAY_KEY[formId]];

          return (
            <View key={formId} style={[styles.formCard, !isUnlocked && styles.formCardLocked]}>
              <View style={styles.formHeader}>
                <View
                  style={[styles.formColor, { backgroundColor: form.spriteConfig.bodyColor }]}
                />
                <Text style={[styles.formName, !isUnlocked && styles.textLocked]}>
                  {formName}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <StatItem label="ATK" value={`${Math.round(form.attackMultiplier * 100)}%`} locked={!isUnlocked} />
                <StatItem label="SPD" value={`${Math.round(form.moveSpeedMultiplier * 100)}%`} locked={!isUnlocked} />
                <StatItem label="RATE" value={`${Math.round(form.fireRateMultiplier * 100)}%`} locked={!isUnlocked} />
              </View>

              {isUnlocked && (
                <Text style={styles.ability}>
                  {t.abilities[form.specialAbility as keyof typeof t.abilities] ?? form.specialAbility}
                </Text>
              )}

              {isUnlocked ? (
                <View style={styles.selectRow}>
                  {primaryForm === formId && (
                    <Text style={styles.selectedBadge}>{t.selectForm.primary}</Text>
                  )}
                  {secondaryForm === formId && (
                    <Text style={styles.selectedBadgeSecondary}>{t.selectForm.secondary}</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      (primaryForm === formId || secondaryForm === formId) && styles.selectButtonSelected,
                    ]}
                    onPress={() => handleFormTap(formId)}
                  >
                    <Text style={styles.selectButtonText}>
                      {primaryForm === formId || secondaryForm === formId ? t.selectForm.selected : t.selectForm.select}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : cond.type === 'unlock' ? (
                <View style={styles.unlockRow}>
                  <Text style={styles.unlockCondition}>
                    {t.selectForm.unlockCondition(cond.requiredStage, cond.cost)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.unlockButton, !canBuy && styles.unlockButtonDisabled]}
                    disabled={!canBuy}
                    onPress={() => handleUnlock(formId)}
                  >
                    <Text style={styles.unlockButtonText}>{t.selectForm.unlock}</Text>
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
            <Text style={styles.formName}>{t.forms.awakened}</Text>
          </View>
          <Text style={styles.comboOnly}>{t.selectForm.awakenedComboOnly}</Text>
        </View>
      </ScrollView>

      {primaryForm && secondaryForm && (
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>{t.selectForm.startStage}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.backButton, { marginBottom: Math.max(insets.bottom, 24) }]} onPress={() => router.push('/stages')}>
        <Text style={styles.backButtonText}>{t.selectForm.backToStages}</Text>
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
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    backgroundColor: COLORS.neonBlue + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectedBadgeSecondary: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonGreen,
    backgroundColor: COLORS.neonGreen + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectButton: {
    backgroundColor: COLORS.neonBlue + '33',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  selectButtonSelected: {
    backgroundColor: COLORS.neonBlue + '55',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.neonBlue,
  },
  startButton: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: COLORS.neonBlue + '44',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
  },
  startButtonText: {
    fontSize: 16,
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
    marginBottom: 24,
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
