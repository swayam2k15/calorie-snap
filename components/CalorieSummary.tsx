import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, MACRO_COLORS } from '@/lib/constants';
import MacroBar from './MacroBar';

interface CalorieSummaryProps {
  totalCalories: number;
  goal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function CalorieSummary({
  totalCalories,
  goal,
  protein,
  carbs,
  fat,
}: CalorieSummaryProps) {
  const progress = Math.min(totalCalories / goal, 1);
  const remaining = Math.max(goal - totalCalories, 0);
  const isOver = totalCalories > goal;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>TODAY'S CALORIES</Text>
          <View style={styles.calorieRow}>
            <Text style={[styles.total, isOver && styles.totalOver]}>
              {totalCalories.toLocaleString()}
            </Text>
            <Text style={styles.goal}> / {goal.toLocaleString()} kcal</Text>
          </View>
        </View>
        <View style={styles.remainingBox}>
          <Text style={[styles.remainingValue, isOver && { color: COLORS.accent }]}>
            {isOver
              ? `+${(totalCalories - goal).toLocaleString()}`
              : remaining.toLocaleString()}
          </Text>
          <Text style={styles.remainingLabel}>{isOver ? 'over' : 'left'}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            isOver && styles.progressOver,
          ]}
        />
      </View>

      {/* Macros */}
      <View style={styles.macros}>
        <MacroBar label="Protein" value={protein} color={MACRO_COLORS.protein} unit="g" />
        <View style={styles.divider} />
        <MacroBar label="Carbs" value={carbs} color={MACRO_COLORS.carbs} unit="g" />
        <View style={styles.divider} />
        <MacroBar label="Fat" value={fat} color={MACRO_COLORS.fat} unit="g" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  total: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalOver: {
    color: COLORS.accent,
  },
  goal: {
    fontSize: 15,
    color: COLORS.textMuted,
  },
  remainingBox: {
    alignItems: 'flex-end',
  },
  remainingValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  remainingLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressBg: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 99,
  },
  progressOver: {
    backgroundColor: COLORS.accent,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
});
