import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/theme';

const TIMELINE_ITEMS = [
  {
    day: '第1天',
    title: '健康检查提醒',
    category: '健康档案',
  },
  {
    day: '第3天',
    title: '如何与猫咪建立亲密感',
    category: '情感陪伴',
  },
  {
    day: '第7天',
    title: '疫苗接种计划',
    category: '护理知识',
  },
] as const;

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>陪伴生命周期</Text>
          <Text style={styles.subtitle}>
            你已完成协议签署，请按照时间轴完成后续步骤。
          </Text>
        </View>

        <View style={styles.timeline}>
          {TIMELINE_ITEMS.map((item, index) => {
            const isLast = index === TIMELINE_ITEMS.length - 1;
            return (
              <View
                key={item.day}
                style={[styles.timelineRow, isLast && styles.timelineRowLast]}>
                <View style={styles.indicatorColumn}>
                  <View style={styles.marker} />
                  {!isLast ? <View style={styles.connector} /> : null}
                </View>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.dayText}>{item.day}</Text>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.l,
    gap: Theme.spacing.l,
  },
  header: {
    gap: Theme.spacing.s,
  },
  title: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s22,
    fontWeight: Theme.typography.weight.semiBold,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s14,
  },
  timeline: {
    gap: Theme.spacing.s,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Theme.spacing.m,
    paddingBottom: Theme.spacing.l,
  },
  timelineRowLast: {
    paddingBottom: Theme.spacing.s0,
  },
  indicatorColumn: {
    width: Theme.spacing.l,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  marker: {
    width: Theme.spacing.s12,
    height: Theme.spacing.s12,
    borderRadius: Theme.radius.r6,
    backgroundColor: Theme.colors.successDeep,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.successDeep,
  },
  connector: {
    flex: Theme.layout.full,
    width: Theme.borderWidth.hairline,
    backgroundColor: Theme.colors.borderWarm,
    marginTop: Theme.spacing.s,
  },
  card: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.cardTranslucentSoft,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderWarm,
    padding: Theme.spacing.m,
    gap: Theme.spacing.s,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Theme.spacing.s,
  },
  dayText: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.size.s13,
  },
  categoryPill: {
    backgroundColor: Theme.colors.surfaceNeutral,
    borderRadius: Theme.layout.radius,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.borderNeutral,
    paddingVertical: Theme.spacing.s,
    paddingHorizontal: Theme.spacing.m,
  },
  categoryText: {
    color: Theme.colors.textSubtle,
    fontSize: Theme.typography.size.s12,
    fontWeight: Theme.typography.weight.semiBold,
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.size.s16,
    fontWeight: Theme.typography.weight.semiBold,
  },
});
