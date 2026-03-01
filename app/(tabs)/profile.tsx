import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import { COLORS, DAILY_CALORIE_GOAL } from '@/lib/constants';
import { Meal } from '@/lib/types';

interface Stats {
  totalMeals: number;
  totalDays: number;
  avgDailyCalories: number;
  topDish: string | null;
  thisWeekCalories: number;
}

export default function ProfileScreen() {
  const [stats, setStats] = useState<Stats>({
    totalMeals: 0,
    totalDays: 0,
    avgDailyCalories: 0,
    topDish: null,
    thisWeekCalories: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const deviceId = await getDeviceId();
      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      if (!data || data.length === 0) return;

      const totalMeals = data.length;
      const uniqueDays = new Set(
        data.map((m: Meal) => new Date(m.created_at).toDateString()),
      ).size;
      const avgDailyCalories = Math.round(
        data.reduce((s: number, m: Meal) => s + m.calories, 0) / uniqueDays,
      );

      // Most scanned dish
      const dishCounts: Record<string, number> = {};
      for (const meal of data) {
        dishCounts[meal.dish_name] = (dishCounts[meal.dish_name] ?? 0) + 1;
      }
      const topDish =
        Object.entries(dishCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
        null;

      // This week's total
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekCalories = data
        .filter((m: Meal) => new Date(m.created_at) >= weekAgo)
        .reduce((s: number, m: Meal) => s + m.calories, 0);

      setStats({ totalMeals, totalDays: uniqueDays, avgDailyCalories, topDish, thisWeekCalories });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🥗</Text>
          </View>
          <Text style={styles.profileName}>My Stats</Text>
          <Text style={styles.profileSubtitle}>Your nutrition journey</Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="Meals Logged" value={String(stats.totalMeals)} emoji="📸" />
          <StatCard label="Days Tracked" value={String(stats.totalDays)} emoji="📅" />
          <StatCard
            label="Avg Daily Cal"
            value={stats.avgDailyCalories > 0 ? String(stats.avgDailyCalories) : '—'}
            emoji="🔥"
            unit="kcal"
          />
          <StatCard
            label="This Week"
            value={
              stats.thisWeekCalories > 0
                ? stats.thisWeekCalories.toLocaleString()
                : '—'
            }
            emoji="📊"
            unit="kcal"
          />
        </View>

        {/* Top dish */}
        {stats.topDish ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>⭐ MOST SCANNED DISH</Text>
            <Text style={styles.topDishName}>{stats.topDish}</Text>
          </View>
        ) : null}

        {/* Daily goal */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DAILY CALORIE GOAL</Text>
          <Text style={styles.goalValue}>
            {DAILY_CALORIE_GOAL.toLocaleString()} kcal
          </Text>
          {stats.avgDailyCalories > 0 && (
            <Text style={styles.goalNote}>
              You're averaging{' '}
              <Text
                style={{
                  color:
                    stats.avgDailyCalories <= DAILY_CALORIE_GOAL
                      ? COLORS.primary
                      : COLORS.accent,
                  fontWeight: '700',
                }}
              >
                {stats.avgDailyCalories.toLocaleString()} kcal/day
              </Text>
              {stats.avgDailyCalories <= DAILY_CALORIE_GOAL
                ? ' — on track 🎉'
                : ' — try reducing portions.'}
            </Text>
          )}
        </View>

        {/* App info */}
        <Text style={styles.appInfo}>
          CalorieSnap v1.0 · Powered by Gemini 2.5 Flash
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  emoji,
  unit,
}: {
  label: string;
  value: string;
  emoji: string;
  unit?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: { fontSize: 44 },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileSubtitle: { fontSize: 15, color: COLORS.textMuted },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '46%',
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: { fontSize: 30, marginBottom: 8 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  statUnit: { fontSize: 13, color: COLORS.textMuted },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  topDishName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  goalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  goalNote: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  appInfo: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    paddingBottom: 8,
  },
});
