import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Theme.colors.tabBarActive,
        tabBarInactiveTintColor: Theme.colors.tabBarInactive,
        tabBarStyle: styles.tabBar,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '缘分',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={Theme.sizes.s28} name="heart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: '陪伴',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={Theme.sizes.s28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '广场',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={Theme.sizes.s28} name="person.2.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Theme.colors.background,
    borderTopColor: Theme.colors.border,
  },
  header: {
    backgroundColor: Theme.colors.background,
    height: Theme.layout.headerHeight,
  },
  headerTitle: {
    color: Theme.colors.text,
    fontWeight: 'bold',
  },
});
