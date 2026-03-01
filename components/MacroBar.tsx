import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/constants';

interface MacroBarProps {
  label: string;
  value: number;
  color: string;
  unit: string;
}

export default function MacroBar({ label, value, color, unit }: MacroBarProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.value}>
        {Math.round(value)}
        {unit}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  label: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
