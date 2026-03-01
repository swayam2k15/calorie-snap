import { MealType } from './types';

export const COLORS = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  accent: '#ef4444',
  accentOrange: '#f97316',
  background: '#f8fafc',
  card: '#ffffff',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  // Dark mode
  backgroundDark: '#0f172a',
  cardDark: '#1e293b',
  textDark: '#f1f5f9',
  textMutedDark: '#94a3b8',
  borderDark: '#334155',
};

export const DAILY_CALORIE_GOAL = 2000;

export const MACRO_COLORS = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#ef4444',
};

export const MEAL_TYPE_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

export function getMealTypeByTime(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  return 'dinner';
}
