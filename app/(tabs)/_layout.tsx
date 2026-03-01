import React from 'react';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { COLORS } from '@/lib/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f3f4f6',
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        headerStyle: { backgroundColor: COLORS.background },
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: COLORS.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Meal History',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'clock.fill', android: 'history', web: 'history' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Stats',
          headerTitle: 'My Stats',
          tabBarIcon: ({ color, size }) => (
            <SymbolView
              name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }}
              size={size}
              tintColor={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
