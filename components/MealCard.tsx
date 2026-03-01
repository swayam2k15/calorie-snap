import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Meal } from '@/lib/types';
import { COLORS, MEAL_TYPE_ICONS } from '@/lib/constants';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
}

export default function MealCard({ meal, onPress }: MealCardProps) {
  const time = new Date(meal.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const icon = MEAL_TYPE_ICONS[meal.meal_type] ?? '🍽️';
  const mealLabel =
    meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {meal.image_url ? (
        <Image source={{ uri: meal.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderEmoji}>🍽️</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.dishName} numberOfLines={1}>
          {meal.dish_name}
        </Text>
        <Text style={styles.meta}>
          {icon} {mealLabel} · {time}
        </Text>
        <View style={styles.macros}>
          <Text style={styles.calories}>{meal.calories} kcal</Text>
          <Text style={styles.macro}>P {Math.round(meal.protein_g)}g</Text>
          <Text style={styles.macro}>C {Math.round(meal.carbs_g)}g</Text>
          <Text style={styles.macro}>F {Math.round(meal.fat_g)}g</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  imagePlaceholderEmoji: {
    fontSize: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  calories: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.accentOrange,
    marginRight: 2,
  },
  macro: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
