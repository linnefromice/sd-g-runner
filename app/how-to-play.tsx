import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

const SECTIONS = [
  {
    title: 'BASIC CONTROLS',
    items: [
      { label: 'Move', desc: 'Drag anywhere to move your mecha. It follows your finger directly.' },
      { label: 'Tap to Move', desc: 'Tap a spot on screen and your mecha will glide there automatically.' },
      { label: 'Shooting', desc: 'Your mecha fires automatically. No button needed.' },
      { label: 'Pause', desc: 'Tap the pause button (top-right) to pause during gameplay.' },
    ],
  },
  {
    title: 'GATES',
    description: 'Gates appear as pairs of columns scrolling toward you. Pass through one side to activate its effect. Each gate type is color-coded.',
    items: [
      {
        label: 'Enhance',
        color: COLORS.gateEnhance,
        desc: 'Boosts a stat permanently for the stage. Examples: ATK +5, SPD +10%, Fire Rate +20%.',
        extra: 'Combo +1 — consecutive enhance gates build your combo gauge.',
      },
      {
        label: 'Recovery',
        color: COLORS.gateRecovery,
        desc: 'Restores HP. Can be a flat amount (HP +20, +30) or percentage-based (HP +50%).',
        extra: 'No effect on combo gauge.',
      },
      {
        label: 'Tradeoff',
        color: COLORS.gateTradeoff,
        desc: 'Raises one stat but lowers another. Examples: ATK↑ SPD↓, SPD↑ ATK↓, Fire Rate↑ ATK↓.',
        extra: 'Resets combo gauge to 0. Choose carefully.',
      },
      {
        label: 'Refit',
        color: COLORS.gateRefit,
        desc: 'Switches your mecha to a different form (Heavy Artillery or High Speed). Stats change completely.',
        extra: 'Resets combo gauge to 0.',
      },
    ],
  },
  {
    title: 'GATE LAYOUTS',
    items: [
      { label: 'Forced', desc: 'You must pass through one side — the gates span the full width. Choose wisely.' },
      { label: 'Optional', desc: 'Gates leave a gap. You can dodge them entirely or pass through one side.' },
    ],
  },
  {
    title: 'COMBO & AWAKENING',
    items: [
      { label: 'Combo Gauge', desc: 'Pass through 3 consecutive Enhance gates to fill the combo gauge (shown as 3 segments on HUD).' },
      { label: 'Awakened Form', desc: 'When the combo gauge fills, your mecha transforms into the Awakened form for 10 seconds — 2x ATK, homing shots, and invincibility.' },
      { label: 'Combo Reset', desc: 'Taking damage, passing through a Tradeoff gate, or passing through a Refit gate resets your combo to 0.' },
    ],
  },
  {
    title: 'TRANSFORM',
    items: [
      { label: 'Transform Gauge', desc: 'Builds up over time, and by defeating enemies (+8) and passing through gates (+12). When full, you can transform.' },
      { label: 'How to Transform', desc: 'Tap the TF button (bottom-right) when the gauge is full. Switches between your Primary and Secondary form.' },
      { label: 'Form Selection', desc: 'Choose two forms before starting a stage. Primary is your starting form, Secondary is your transform target.' },
      { label: 'Refit Gates', desc: 'Refit gates still force-switch your form regardless of the transform gauge. This can put you in a form outside your selected pair.' },
    ],
  },
  {
    title: 'MECHA FORMS',
    items: [
      { label: 'Standard', desc: 'Balanced stats. No special ability. Good for beginners.' },
      { label: 'Heavy Artillery', desc: 'High ATK (1.8x), slow movement (0.8x) and fire rate (0.6x). Shots cause explosions.' },
      { label: 'High Speed', desc: 'Fast movement (1.4x) and fire rate (1.5x), low ATK (0.7x). Shots pierce through enemies.' },
      { label: 'Awakened', desc: 'Activated by combo only (not selectable). 2x ATK, 1.3x fire rate, triple homing shots, invincible. Lasts 10 seconds.' },
    ],
  },
  {
    title: 'COMBAT',
    items: [
      { label: 'Enemies', desc: 'Stationary enemies hover in place. Patrol enemies move side-to-side. Rush enemies charge toward you.' },
      { label: 'Damage & i-Frame', desc: 'When hit, you take damage and become invincible for 1.5 seconds (mecha blinks during this time).' },
      { label: 'Boss Stages', desc: 'Some stages have a boss. The background slows, enemy spawning stops, and you must defeat the boss to clear the stage.' },
      { label: 'EX Gauge', desc: 'Builds up by defeating enemies and passing through gates. (EX Burst coming soon)' },
    ],
  },
  {
    title: 'SCORING & PROGRESSION',
    items: [
      { label: 'Score', desc: 'Earn points by defeating enemies (100-200 pts), passing gates (150 pts), and clearing stages (1000-3000 pts).' },
      { label: 'Credits', desc: 'Currency earned from enemy kills and stage clears. Spend on upgrades and form unlocks.' },
      { label: 'Upgrades', desc: 'Permanently boost base ATK, HP, and Speed from the Upgrade screen. Effects carry over to all future runs.' },
      { label: 'Stage Clear', desc: 'Normal stages clear when time runs out. Boss stages clear when the boss is defeated.' },
    ],
  },
] as const;

export default function HowToPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How to Play</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {'description' in section && section.description && (
              <Text style={styles.sectionDesc}>{section.description}</Text>
            )}
            {section.items.map((item) => (
              <View key={item.label} style={styles.item}>
                <View style={styles.itemHeader}>
                  {'color' in item && item.color && (
                    <View style={[styles.swatch, { backgroundColor: item.color }]} />
                  )}
                  <Text style={[
                    styles.itemLabel,
                    'color' in item && item.color ? { color: item.color } : null,
                  ]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={styles.itemDesc}>{item.desc}</Text>
                {'extra' in item && item.extra && (
                  <Text style={styles.itemExtra}>{item.extra}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.backButton, { marginBottom: Math.max(insets.bottom, 24) }]}
        onPress={() => router.push('/')}
      >
        <Text style={styles.backButtonText}>Back to Title</Text>
      </TouchableOpacity>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 2,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.lightGray,
    marginBottom: 8,
    lineHeight: 18,
  },
  item: {
    backgroundColor: '#ffffff08',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  itemDesc: {
    fontSize: 13,
    color: COLORS.lightGray,
    lineHeight: 18,
  },
  itemExtra: {
    fontSize: 12,
    color: COLORS.scoreYellow,
    fontStyle: 'italic',
    marginTop: 4,
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
