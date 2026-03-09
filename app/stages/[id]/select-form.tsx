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
  'SD_Sniper',
  'SD_Scatter',
  'SD_Guardian',
];

/** Decorative corner brackets for HUD/sci-fi framing */
function CornerBrackets({ color, size = 10, thickness = 1 }: { color: string; size?: number; thickness?: number }) {
  const style = { position: 'absolute' as const, width: size, height: size, borderColor: color };
  return (
    <>
      <View style={[style, { top: -1, left: -1, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[style, { top: -1, right: -1, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[style, { bottom: -1, left: -1, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[style, { bottom: -1, right: -1, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </>
  );
}

/** Visual stat bar with label, fill bar, and value */
function StatBar({ label, ratio, color, value, locked }: {
  label: string;
  ratio: number;
  color: string;
  value: string;
  locked: boolean;
}) {
  return (
    <View style={styles.statBarRow}>
      <Text style={[styles.statBarLabel, locked && styles.textLocked]}>{label}</Text>
      <View style={styles.statBarTrack}>
        {!locked && (
          <View
            style={[
              styles.statBarFill,
              {
                width: `${Math.min(100, ratio * 100)}%` as `${number}%`,
                backgroundColor: color,
                shadowColor: color,
                shadowOpacity: 0.6,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        )}
      </View>
      <Text style={[styles.statBarValue, locked && styles.textLocked]}>{locked ? '---' : value}</Text>
    </View>
  );
}

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

  const isPrimary = (formId: MechaFormId) => primaryForm === formId;
  const isSecondary = (formId: MechaFormId) => secondaryForm === formId;
  const isSelected = (formId: MechaFormId) => isPrimary(formId) || isSecondary(formId);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 40 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.selectForm.title}</Text>
        <View style={styles.subtitleRow}>
          <View style={styles.subtitleDot} />
          <Text style={styles.subtitle}>{t.selectForm.stage} {stageIdNum}</Text>
        </View>
      </View>
      <View style={styles.headerLine} />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {SELECTABLE_FORMS.map((formId) => {
          const form = FORM_DEFINITIONS[formId];
          const isUnlocked = unlockedForms.includes(formId);
          const cond = FORM_UNLOCK_CONDITIONS[formId];
          const canBuy = !isUnlocked && canUnlockForm(formId, unlockedStages, credits);
          const formName = t.forms[formId];
          const bodyColor = form.spriteConfig.bodyColor;
          const selected = isSelected(formId);

          return (
            <View
              key={formId}
              style={[
                styles.formCard,
                !isUnlocked && styles.formCardLocked,
                selected && {
                  borderColor: isPrimary(formId) ? COLORS.neonBlue : COLORS.neonGreen,
                  shadowColor: isPrimary(formId) ? COLORS.neonBlue : COLORS.neonGreen,
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 6,
                },
              ]}
            >
              <CornerBrackets
                color={selected ? (isPrimary(formId) ? COLORS.neonBlue + 'aa' : COLORS.neonGreen + 'aa') : isUnlocked ? COLORS.neonBlue + '44' : '#33333344'}
                size={8}
              />

              <View style={styles.formHeader}>
                {/* Larger color swatch with glow */}
                <View style={[styles.formColorOuter, { shadowColor: bodyColor }]}>
                  <View style={[styles.formColor, { backgroundColor: bodyColor }]} />
                </View>
                <View style={styles.formTitleArea}>
                  <Text style={[styles.formName, !isUnlocked && styles.textLocked]}>
                    {formName}
                  </Text>
                  {isUnlocked && (
                    <Text style={styles.ability}>
                      {t.abilities[form.specialAbility as keyof typeof t.abilities] ?? form.specialAbility}
                    </Text>
                  )}
                </View>
              </View>

              {/* Stat bars */}
              <View style={styles.statsArea}>
                <StatBar
                  label="ATK"
                  ratio={form.attackMultiplier}
                  color="#FF6644"
                  value={`${Math.round(form.attackMultiplier * 100)}%`}
                  locked={!isUnlocked}
                />
                <StatBar
                  label="SPD"
                  ratio={form.moveSpeedMultiplier}
                  color={COLORS.neonBlue}
                  value={`${Math.round(form.moveSpeedMultiplier * 100)}%`}
                  locked={!isUnlocked}
                />
                <StatBar
                  label="RATE"
                  ratio={form.fireRateMultiplier}
                  color={COLORS.neonGreen}
                  value={`${Math.round(form.fireRateMultiplier * 100)}%`}
                  locked={!isUnlocked}
                />
              </View>

              {isUnlocked ? (
                <View style={styles.selectRow}>
                  {isPrimary(formId) && (
                    <View style={[styles.roleBadge, styles.roleBadgePrimary]}>
                      <Text style={[styles.roleBadgeText, { color: COLORS.neonBlue }]}>{t.selectForm.primary}</Text>
                    </View>
                  )}
                  {isSecondary(formId) && (
                    <View style={[styles.roleBadge, styles.roleBadgeSecondary]}>
                      <Text style={[styles.roleBadgeText, { color: COLORS.neonGreen }]}>{t.selectForm.secondary}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      selected && styles.selectButtonSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleFormTap(formId)}
                  >
                    <Text style={styles.selectButtonText}>
                      {selected ? t.selectForm.selected : t.selectForm.select}
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
                    activeOpacity={0.7}
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

        {/* Awakened form (display only) */}
        <View style={[styles.formCard, styles.formCardLocked]}>
          <CornerBrackets color="#33333344" size={8} />
          <View style={styles.formHeader}>
            <View style={[styles.formColorOuter, { shadowColor: FORM_DEFINITIONS.SD_Awakened.spriteConfig.bodyColor }]}>
              <View style={[styles.formColor, { backgroundColor: FORM_DEFINITIONS.SD_Awakened.spriteConfig.bodyColor }]} />
            </View>
            <View style={styles.formTitleArea}>
              <Text style={styles.formName}>{t.forms.SD_Awakened}</Text>
              <Text style={styles.comboOnly}>{t.selectForm.awakenedComboOnly}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {primaryForm && secondaryForm && (
        <TouchableOpacity style={styles.startButton} activeOpacity={0.7} onPress={handleStart}>
          <CornerBrackets color={COLORS.neonBlue + '88'} size={8} />
          <Text style={styles.startButtonText}>{t.selectForm.startStage}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.backButton, { marginBottom: Math.max(insets.bottom, 24) }]}
        activeOpacity={0.7}
        onPress={() => router.push('/stages')}
      >
        <Text style={styles.backButtonText}>{t.selectForm.backToStages}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerLine: {
    height: 1,
    backgroundColor: COLORS.neonBlue + '33',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: COLORS.neonBlue + '66',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  subtitleDot: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.neonBlue + '88',
    transform: [{ rotate: '45deg' }],
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.lightGray,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 24,
    gap: 12,
    paddingBottom: 16,
  },
  formCard: {
    backgroundColor: '#ffffff06',
    borderRadius: 2,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
  },
  formCardLocked: {
    backgroundColor: '#ffffff03',
    borderColor: '#ffffff0e',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  formColorOuter: {
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
    marginRight: 12,
  },
  formColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  formTitleArea: {
    flex: 1,
  },
  formName: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  ability: {
    fontSize: 11,
    color: COLORS.neonGreen,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  statsArea: {
    gap: 6,
    marginBottom: 12,
  },
  statBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBarLabel: {
    fontSize: 10,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 2,
    width: 36,
  },
  statBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statBarValue: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    width: 40,
    textAlign: 'right',
  },
  textLocked: { color: '#3a3a3a' },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
  },
  roleBadgePrimary: {
    backgroundColor: COLORS.neonBlue + '15',
    borderColor: COLORS.neonBlue + '44',
  },
  roleBadgeSecondary: {
    backgroundColor: COLORS.neonGreen + '15',
    borderColor: COLORS.neonGreen + '44',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  selectButton: {
    backgroundColor: COLORS.neonBlue + '15',
    paddingVertical: 10,
    borderRadius: 2,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.neonBlue + '33',
  },
  selectButtonSelected: {
    backgroundColor: COLORS.neonBlue + '30',
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
    paddingVertical: 16,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
    shadowColor: COLORS.neonBlue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.neonBlue,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  unlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  unlockCondition: {
    fontSize: 11,
    color: '#555555',
    letterSpacing: 0.5,
  },
  unlockButton: {
    backgroundColor: COLORS.scoreYellow + '18',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.scoreYellow + '44',
  },
  unlockButtonDisabled: { opacity: 0.3 },
  unlockButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.scoreYellow,
    letterSpacing: 1,
  },
  comboOnly: {
    fontSize: 11,
    color: '#555555',
    fontStyle: 'italic',
    marginTop: 2,
  },
  backButton: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff06',
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff1a',
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.lightGray,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
