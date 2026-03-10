import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/constants/colors';

type SectionItem = {
  label: string;
  desc: string;
  color?: string;
  extra?: string;
};

type Section = {
  title: string;
  description?: string;
  items: SectionItem[];
};

function useSections(): Section[] {
  const t = useTranslation();
  const s = t.howToPlay.sections;

  return [
    {
      title: s.basicControls.title,
      items: Object.values(s.basicControls.items),
    },
    {
      title: s.gates.title,
      description: s.gates.description,
      items: [
        { ...s.gates.items.enhance, color: COLORS.gateEnhance },
        { ...s.gates.items.recovery, color: COLORS.gateRecovery },
        { ...s.gates.items.tradeoff, color: COLORS.gateTradeoff },
        { ...s.gates.items.refit, color: COLORS.gateRefit },
        { ...s.gates.items.growth, color: COLORS.gateGrowth },
        { ...s.gates.items.roulette, color: COLORS.gateRoulette },
      ],
    },
    {
      title: s.gateLayouts.title,
      items: Object.values(s.gateLayouts.items),
    },
    {
      title: s.comboAwakening.title,
      items: Object.values(s.comboAwakening.items),
    },
    {
      title: s.transform.title,
      items: Object.values(s.transform.items),
    },
    {
      title: s.mechaForms.title,
      items: Object.values(s.mechaForms.items),
    },
    {
      title: s.combat.title,
      items: Object.values(s.combat.items),
    },
    {
      title: s.scoringProgression.title,
      items: Object.values(s.scoringProgression.items),
    },
  ];
}

export default function HowToPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const sections = useSections();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 40 }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.howToPlay.title}</Text>
      </View>
      <View style={styles.headerLine} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.description && (
              <Text style={styles.sectionDesc}>{section.description}</Text>
            )}
            {section.items.map((item) => (
              <View key={item.label} style={styles.item}>
                <View style={styles.itemHeader}>
                  {item.color && (
                    <View style={[styles.swatch, { backgroundColor: item.color }]} />
                  )}
                  <Text style={[
                    styles.itemLabel,
                    item.color ? { color: item.color } : null,
                  ]}>
                    {item.label}
                  </Text>
                </View>
                <Text style={styles.itemDesc}>{item.desc}</Text>
                {item.extra && (
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
        <Text style={styles.backButtonText}>{t.howToPlay.backToTitle}</Text>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    letterSpacing: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionDesc: {
    fontSize: 13,
    color: COLORS.lightGray,
    marginBottom: 8,
    lineHeight: 18,
  },
  item: {
    backgroundColor: '#ffffff06',
    borderRadius: 2,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ffffff0D',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 1,
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.5,
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
