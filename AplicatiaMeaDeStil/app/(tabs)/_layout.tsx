import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';

const homeTabIcon = ({ color }: { color: string }) => <IconSymbol size={28} name="house.fill" color={color} />;
const exploreTabIcon = ({ color }: { color: string }) => <IconSymbol size={28} name="paperplane.fill" color={color} />;
const historyTabIcon = ({ color }: { color: string }) => <IconSymbol size={28} name="clock.fill" color={color} />;
const adminTabIcon = ({ color }: { color: string }) => <IconSymbol size={28} name="shield.fill" color={color} />;
const profileTabIcon = ({ color }: { color: string }) => <IconSymbol size={28} name="person.fill" color={color} />;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin } = useAuth();
  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.icon,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.tertiary, // Gold border on top
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: homeTabIcon,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: exploreTabIcon,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: historyTabIcon,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: adminTabIcon,
          href: isAdmin ? '/(tabs)/admin' : null, // Hide tab if not admin
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: profileTabIcon,
        }}
      />
      <Tabs.Screen
        name="outfit-detail"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
