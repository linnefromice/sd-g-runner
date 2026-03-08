import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { FORM_DEFINITIONS } from '@/game/forms';
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
      <View style={styles.headerLine} />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SELECTABLE_FORMS.map((formId) => {
          const form = FORM_DEFINITIONS[formId];
          const isUnlocked = unlockedForms.includes(formId);
          const cond = FORM_UNLOCK_CONDITIONS[formId];
          const canBuy = !isUnlocked && canUnlockForm(formId, unlockedStages, credits);
          const formName = t.forms[formId];

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
            <Text style={styles.formName}>{t.forms.SD_Awakened}</Text>
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
    marginBottom: 12,
  },
  headerLine: {
    height: 1,
    backgroundColor: COLORS.neonBlue + '33',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.lightGray,
    marginTop: 4,
    letterSpacing: 1,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 16,
  },
  formCard: {
    backgroundColor: '#ffffff08',
    borderRadius: 2,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  formCardLocked: {
    backgroundColor: '#ffffff04',
    borderColor: '#ffffff11',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formColor: {
    width: 14,
    height: 14,
    borderRadius: 2,
    marginRight: 10,
  },
  formName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 1,
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
    letterSpacing: 2,
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
  textLocked: { color: '#444444' },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    backgroundColor: COLORS.neonBlue + '18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  selectedBadgeSecondary: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonGreen,
    backgroundColor: COLORS.neonGreen + '18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.neonGreen + '44',
  },
  selectButton: {
    backgroundColor: COLORS.neonBlue + '18',
    paddingVertical: 10,
    borderRadius: 2,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '44',
  },
  selectButtonSelected: {
    backgroundColor: COLORS.neonBlue + '33',
    borderColor: COLORS.neonBlue,
  },
  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.neonBlue,
    letterSpacing: 1,
  },
  startButton: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: COLORS.neonBlue + '22',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.neonBlue,
    letterSpacing: 2,
  },
  unlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  unlockCondition: {
    fontSize: 11,
    color: '#666666',
    letterSpacing: 0.5,
  },
  unlockButton: {
    backgroundColor: COLORS.scoreYellow + '22',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.scoreYellow + '55',
  },
  unlockButtonDisabled: { opacity: 0.3 },
  unlockButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.scoreYellow,
  },
  comboOnly: {
    fontSize: 11,
    color: '#666666',
    fontStyle: 'italic',
  },
  backButton: {
    marginHorizontal: 24,
    marginBottom: 24,
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
