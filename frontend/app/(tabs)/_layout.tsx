import { Tabs } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { PawzzleTabBar } from '../../components/pawzzle-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <PawzzleTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: '宠物',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="pawprint.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="pawprint.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '广场',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.2.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: '私聊',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="message.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
