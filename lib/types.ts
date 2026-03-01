export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  device_id: string;
  image_url: string | null;
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_type: MealType;
  confidence: number;
  notes: string | null;
  created_at: string;
}

export interface AnalysisResult {
  status: 'confident' | 'clarification_needed' | 'no_food_detected';
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
  portion_description: string;
  clarification_question: string | null;
  clarification_options: ClarificationOption[] | null;
}

export interface ClarificationOption {
  label: string;
  emoji: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
