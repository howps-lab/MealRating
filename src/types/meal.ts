export interface MealRating {
  id: string;
  description: string;
  amount: number;
  location: string;
  rating: number; // 1 to 5
  meal_date: string; // ISO date 'YYYY-MM-DD'
  photo_url: string | null;
  created_at: string;
}

export interface MealFormData {
  description: string;
  amount: string; // string in input for raw typing, parsed to number
  location: string;
  rating: number | null; // null when unselected
  meal_date: string; // 'YYYY-MM-DD'
  photo_file: File | null;
  photo_preview: string | null;
}

export type SortOption = 'date_desc' | 'rating_desc' | 'rating_asc';

export interface SummaryStats {
  totalMeals: number;
  averageRating: number;
  totalSpending: number;
}
