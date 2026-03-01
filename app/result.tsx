import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/deviceId';
import { getPendingImageUrl, clearPendingImageUrl } from '@/lib/scanState';
import { COLORS, MACRO_COLORS, getMealTypeByTime, MEAL_TYPE_ICONS } from '@/lib/constants';
import { AnalysisResult, ClarificationOption, MealType } from '@/lib/types';
import ClarificationModal from '@/components/ClarificationModal';
import MacroBar from '@/components/MacroBar';

type Phase = 'analyzing' | 'results' | 'saving' | 'error';

export default function ResultScreen() {
  const [phase, setPhase] = useState<Phase>('analyzing');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mealType, setMealType] = useState<MealType>(getMealTypeByTime());
  const [showClarification, setShowClarification] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const imageUrl = useRef(getPendingImageUrl() ?? '');

  useEffect(() => {
    analyze();
    return () => clearPendingImageUrl();
  }, []);

  const analyze = async (clarification?: string) => {
    setPhase('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-meal', {
        body: { imageUrl: imageUrl.current, clarification },
      });

      if (error) throw error;

      const typedData = data as AnalysisResult;
      setResult(typedData);

      if (
        typedData.status === 'clarification_needed' &&
        typedData.clarification_options?.length &&
        !clarification
      ) {
        setShowClarification(true);
      }

      setPhase('results');
    } catch (err: any) {
      setErrorMessage(err.message ?? 'Analysis failed. Please try again.');
      setPhase('error');
    }
  };

  const handleClarification = (option: ClarificationOption) => {
    setShowClarification(false);
    analyze(option.label);
  };

  const saveMeal = async () => {
    if (!result) return;
    setPhase('saving');
    try {
      const deviceId = await getDeviceId();
      const { error } = await supabase.from('meals').insert({
        device_id: deviceId,
        image_url: imageUrl.current,
        dish_name: result.dish_name,
        calories: Math.round(result.calories),
        protein_g: Math.round(result.protein_g * 10) / 10,
        carbs_g: Math.round(result.carbs_g * 10) / 10,
        fat_g: Math.round(result.fat_g * 10) / 10,
        meal_type: mealType,
        confidence: result.confidence,
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Save failed', err.message);
      setPhase('results');
    }
  };

  /* ── Loading state ── */
  if (phase === 'analyzing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          {imageUrl.current ? (
            <Image
              source={{ uri: imageUrl.current }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingTitle}>Analyzing your meal...</Text>
            <Text style={styles.loadingSubtitle}>
              Gemini AI is identifying the food and estimating calories
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Error state ── */
  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Analysis failed</Text>
          <Text style={styles.errorMsg}>{errorMessage}</Text>
          <Pressable style={styles.retryBtn} onPress={() => analyze()}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) return null;

  const confidencePct = Math.round(result.confidence * 100);

  /* ── Results ── */
  return (
    <SafeAreaView style={styles.container}>
      {/* Clarification bottom sheet */}
      <ClarificationModal
        visible={showClarification}
        question={result.clarification_question ?? 'Which food is this?'}
        options={result.clarification_options ?? []}
        onSelect={handleClarification}
        onDismiss={() => setShowClarification(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={18}
            tintColor={COLORS.text}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Calorie Analysis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Food image */}
        {imageUrl.current ? (
          <Image
            source={{ uri: imageUrl.current }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Main result card */}
        <View style={styles.card}>
          <View style={styles.dishRow}>
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{result.dish_name}</Text>
              <Text style={styles.portionDesc}>{result.portion_description}</Text>
            </View>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidencePct}>{confidencePct}%</Text>
              <Text style={styles.confidenceLabel}>confident</Text>
            </View>
          </View>

          {/* Big calorie number */}
          <View style={styles.calorieBox}>
            <Text style={styles.calorieValue}>{Math.round(result.calories)}</Text>
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>

          {/* Macros */}
          <View style={styles.macroRow}>
            <MacroBar label="Protein" value={result.protein_g} color={MACRO_COLORS.protein} unit="g" />
            <MacroBar label="Carbs" value={result.carbs_g} color={MACRO_COLORS.carbs} unit="g" />
            <MacroBar label="Fat" value={result.fat_g} color={MACRO_COLORS.fat} unit="g" />
          </View>
        </View>

        {/* Meal type selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Type</Text>
          <View style={styles.mealTypeRow}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
              <Pressable
                key={type}
                style={[styles.mealTypeBtn, mealType === type && styles.mealTypeBtnActive]}
                onPress={() => setMealType(type)}
              >
                <Text style={styles.mealTypeEmoji}>{MEAL_TYPE_ICONS[type]}</Text>
                <Text
                  style={[
                    styles.mealTypeLabel,
                    mealType === type && styles.mealTypeLabelActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Re-identify link */}
        {result.clarification_options?.length ? (
          <Pressable
            style={styles.reidentifyBtn}
            onPress={() => setShowClarification(true)}
          >
            <Text style={styles.reidentifyText}>
              🤔 Not quite right? Let me re-identify it
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* Save CTA */}
      <View style={styles.saveBar}>
        <Pressable
          style={[styles.saveBtn, phase === 'saving' && styles.saveBtnDisabled]}
          onPress={saveMeal}
          disabled={phase === 'saving'}
        >
          {phase === 'saving' ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <SymbolView
              name={{
                ios: 'checkmark.circle.fill',
                android: 'check_circle',
                web: 'check_circle',
              }}
              size={22}
              tintColor="#fff"
            />
          )}
          <Text style={styles.saveBtnText}>
            {phase === 'saving' ? 'Saving...' : 'Save to Log'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Loading
  loadingWrap: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorEmoji: { fontSize: 64, marginBottom: 16 },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  // Food image
  foodImage: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  // Result card
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dishInfo: { flex: 1, marginRight: 12 },
  dishName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  portionDesc: { fontSize: 13, color: COLORS.textMuted },
  confidenceBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  confidencePct: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  confidenceLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calorieBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  calorieValue: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.accentOrange,
  },
  calorieUnit: { fontSize: 20, color: COLORS.textMuted, marginLeft: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },

  // Meal type
  section: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  mealTypeRow: { flexDirection: 'row', gap: 8 },
  mealTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0fdf4',
  },
  mealTypeEmoji: { fontSize: 22, marginBottom: 4 },
  mealTypeLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  mealTypeLabelActive: { color: COLORS.primary, fontWeight: '700' },

  // Re-identify
  reidentifyBtn: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fefce8',
    alignItems: 'center',
  },
  reidentifyText: { fontSize: 14, color: '#92400e', fontWeight: '500' },

  // Save bar
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
