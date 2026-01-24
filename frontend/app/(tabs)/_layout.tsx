import { Tabs } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { PawzzleTabBar } from '../../components/pawzzle-tab-bar';
import ChatIcon from '@/assets/images/chat.svg';
import HomeIcon from '@/assets/images/index.svg';
import PetIcon from '@/assets/images/pet.svg';
import CommunityIcon from '@/assets/images/square.svg';

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
          tabBarIcon: ({ color, size }) => (
            <HomeIcon width={size ?? 24} height={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: '宠物',
          tabBarIcon: ({ color, size }) => (
            <PetIcon width={size ?? 24} height={size ?? 24} color={color} />
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
          tabBarIcon: ({ color, size }) => (
            <CommunityIcon width={size ?? 24} height={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: '私聊',
          tabBarIcon: ({ color, size }) => (
            <ChatIcon width={size ?? 24} height={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
