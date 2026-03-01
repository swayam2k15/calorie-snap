import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import { COLORS, DAILY_CALORIE_GOAL } from '@/lib/constants';
import { Meal } from '@/lib/types';
import MealCard from '@/components/MealCard';
import CalorieSummary from '@/components/CalorieSummary';

export default function HomeScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTodaysMeals = useCallback(async () => {
    try {
      const deviceId = await getDeviceId();
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('device_id', deviceId)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false });
      setMeals(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTodaysMeals();
    }, [loadTodaysMeals]),
  );

  const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.carbs_g, 0);
  const totalFat = meals.reduce((s, m) => s + m.fat_g, 0);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
              <Text style={styles.date}>{todayLabel}</Text>
            </View>
            <CalorieSummary
              totalCalories={totalCalories}
              goal={DAILY_CALORIE_GOAL}
              protein={totalProtein}
              carbs={totalCarbs}
              fat={totalFat}
            />
            {meals.length > 0 && (
              <Text style={styles.sectionTitle}>Today's Meals</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <MealCard meal={item} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={styles.emptyTitle}>No meals yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the button below to snap your first meal!
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={COLORS.primary}
            onRefresh={async () => {
              setRefreshing(true);
              await loadTodaysMeals();
              setRefreshing(false);
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => router.push('/scan')}
      >
        <SymbolView
          name={{ ios: 'camera.fill', android: 'photo_camera', web: 'camera' }}
          size={22}
          tintColor="#fff"
        />
        <Text style={styles.fabText}>Scan Meal</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  date: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
