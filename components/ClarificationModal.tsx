import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { COLORS } from '@/lib/constants';
import { ClarificationOption } from '@/lib/types';

interface ClarificationModalProps {
  visible: boolean;
  question: string;
  options: ClarificationOption[];
  onSelect: (option: ClarificationOption) => void;
  onDismiss: () => void;
}

export default function ClarificationModal({
  visible,
  question,
  options,
  onSelect,
  onDismiss,
}: ClarificationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Inner pressable prevents backdrop tap from closing when tapping sheet */}
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.emoji}>🤔</Text>
          <Text style={styles.title}>Quick Question</Text>
          <Text style={styles.question}>{question}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.options}>
            {options.map((option, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => onSelect(option)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionContent}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionCalories}>
                    ~{option.calories} kcal · P{Math.round(option.protein_g)}g C
                    {Math.round(option.carbs_g)}g F{Math.round(option.fat_g)}g
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.cancelBtn} onPress={onDismiss}>
            <Text style={styles.cancelText}>Use AI's best guess</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 42,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  question: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  options: {
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionPressed: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0fdf4',
  },
  optionEmoji: {
    fontSize: 34,
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  optionCalories: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  arrow: {
    fontSize: 22,
    color: COLORS.textMuted,
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
