import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import { COLORS } from '@/lib/constants';
import { Meal } from '@/lib/types';
import MealCard from '@/components/MealCard';

interface Section {
  title: string;
  data: Meal[];
  totalCalories: number;
}

export default function HistoryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const deviceId = await getDeviceId();
      const { data } = await supabase
        .from('meals')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (!data) return;

      // Group meals by date
      const groups: Record<string, Meal[]> = {};
      for (const meal of data) {
        const date = new Date(meal.created_at).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(meal);
      }

      setSections(
        Object.entries(groups).map(([title, meals]) => ({
          title,
          data: meals,
          totalCalories: meals.reduce((s, m) => s + m.calories, 0),
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
            <Text style={styles.sectionTotal}>
              {section.totalCalories.toLocaleString()} kcal
            </Text>
          </View>
        )}
        renderItem={({ item }) => <MealCard meal={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptySubtitle}>
              Meals you log will appear here grouped by day
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
