import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text } from '@/components/base-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/theme';

type Pet = {
  id: string;
  name: string;
  breed: string;
  matchScore: number;
  location: string;
};

const MOCK_PETS: Pet[] = [
  { id: '1', name: '团子', breed: '金毛寻回犬', matchScore: 98, location: '朝阳公园' },
  { id: '2', name: '露娜', breed: '英国短毛猫', matchScore: 95, location: '三里屯' },
  { id: '3', name: '洛奇', breed: '法国斗牛犬', matchScore: 92, location: '海淀' },
  { id: '4', name: '米洛', breed: '柯基', matchScore: 89, location: '望京' },
  { id: '5', name: '贝拉', breed: '布偶猫', matchScore: 88, location: '国贸' },
];

export default function InstitutionDashboardScreen() {
  const router = useRouter();

  const handlePetPress = (petId: string) => {
    router.push('/adoption/agreement');
  };

  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePetPress(item.id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.matchScore}>匹配度 {item.matchScore}%</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.petInfo}>{item.breed}</Text>
        <Text style={styles.petLocation}>📍 {item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>机构看板</Text>
      </View>

      {/* Filter/Sort Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>按匹配度排序</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={[styles.filterButton, styles.inactiveFilter]}>
          <Text style={styles.inactiveFilterText}>按位置排序</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={MOCK_PETS}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Theme.layout.full,
    backgroundColor: Theme.colors.background,
  },
  header: {
    padding: Theme.spacing.m,
    borderBottomWidth: Theme.borderWidth.hairline,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  headerTitle: {
    fontSize: Theme.typography.size.s20,
    fontFamily: Theme.fonts.heavy,
    color: Theme.colors.text,
  },
  filterBar: {
    flexDirection: 'row',
    padding: Theme.spacing.s,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: Theme.borderWidth.hairline,
    borderBottomColor: Theme.colors.border,
  },
  filterButton: {
    flex: Theme.layout.full,
    paddingVertical: Theme.spacing.s,
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.layout.radius,
    marginHorizontal: Theme.spacing.s,
  },
  filterButtonText: {
    color: Theme.colors.textInverse,
    fontFamily: Theme.fonts.semiBold,
    fontSize: Theme.typography.size.s14,
  },
  inactiveFilter: {
     backgroundColor: Theme.colors.transparent,
  },
  inactiveFilterText: {
    color: Theme.colors.textSecondary,
    fontFamily: Theme.fonts.semiBold,
    fontSize: Theme.typography.size.s14,
  },
  separator: {
    width: Theme.borderWidth.hairline,
    backgroundColor: Theme.colors.border,
  },
  listContent: {
    padding: Theme.spacing.m,
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.layout.radius,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    borderWidth: Theme.borderWidth.hairline,
    borderColor: Theme.colors.border,
    ...Theme.shadows.dashboard,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.s,
  },
  petName: {
    fontSize: Theme.typography.size.s18,
    fontFamily: Theme.fonts.heavy,
    color: Theme.colors.text,
  },
  matchScore: {
    fontSize: Theme.typography.size.s16,
    fontFamily: Theme.fonts.matchScore,
    color: Theme.colors.primary,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  petInfo: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textSecondary,
  },
  petLocation: {
    fontSize: Theme.typography.size.s14,
    color: Theme.colors.textSecondary,
  },
});
