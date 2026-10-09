import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MealRating } from '../types/meal';
import { INITIAL_SAMPLE_MEALS } from '../constants/sampleMeals';

const LOCAL_STORAGE_KEY = 'meal_ratings_data_v1';
const SUPABASE_CONFIG_STORAGE_KEY = 'user_supabase_config_override';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Get configured Supabase credentials from Vite environment or user local override
 */
export function getSupabaseCredentials(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading saved Supabase config:', err);
  }

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(
    SUPABASE_CONFIG_STORAGE_KEY,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  clientInstance = null; // Reset cached client instance
}

export function clearCustomSupabaseCredentials(): void {
  localStorage.removeItem(SUPABASE_CONFIG_STORAGE_KEY);
  clientInstance = null;
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey && url.startsWith('http') && !url.includes('your-project-id')) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return clientInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    anonKey.length > 20
  );
}

// -------------------------------------------------------------
// Fallback Local Storage Repository (Guarantees instant usability)
// -------------------------------------------------------------

function getLocalMeals(): MealRating[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_MEALS));
      return [...INITIAL_SAMPLE_MEALS];
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...INITIAL_SAMPLE_MEALS];
  } catch (err) {
    console.error('Failed to load local meals:', err);
    return [...INITIAL_SAMPLE_MEALS];
  }
}

function saveLocalMeals(meals: MealRating[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(meals));
  } catch (err) {
    console.error('Failed to save local meals:', err);
  }
}

// -------------------------------------------------------------
// Core Service API
// -------------------------------------------------------------

export async function fetchMealsService(): Promise<{ data: MealRating[]; isLive: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('meal_ratings')
        .select('*')
        .order('meal_date', { ascending: false });

      if (error) {
        console.warn('Supabase query error, falling back to local store:', error.message);
        return {
          data: getLocalMeals(),
          isLive: false,
          error: `Supabase Table Note: ${error.message} (Using local persistent store)`,
        };
      }

      if (data) {
        return {
          data: data as MealRating[],
          isLive: true,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.warn('Supabase network exception:', msg);
      return {
        data: getLocalMeals(),
        isLive: false,
        error: `Supabase connection issue: ${msg}`,
      };
    }
  }

  // Local fallback mode
  return {
    data: getLocalMeals(),
    isLive: false,
  };
}

export async function createMealService(mealInput: {
  description: string;
  amount: number;
  location: string;
  rating: number;
  meal_date: string;
  photo_url: string | null;
}): Promise<{ data: MealRating; isLive: boolean }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('meal_ratings')
        .insert([
          {
            description: mealInput.description,
            amount: mealInput.amount,
            location: mealInput.location,
            rating: mealInput.rating,
            meal_date: mealInput.meal_date,
            photo_url: mealInput.photo_url,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        // Also update local cache for smooth offline tolerance
        const currentLocal = getLocalMeals();
        saveLocalMeals([data as MealRating, ...currentLocal]);
        return { data: data as MealRating, isLive: true };
      } else if (error) {
        console.warn('Supabase insert failed, persisting locally:', error.message);
      }
    } catch (err) {
      console.warn('Supabase insert error, persisting locally:', err);
    }
  }

  // Local Fallback creation
  const newMeal: MealRating = {
    id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    description: mealInput.description,
    amount: mealInput.amount,
    location: mealInput.location,
    rating: mealInput.rating,
    meal_date: mealInput.meal_date,
    photo_url: mealInput.photo_url,
    created_at: new Date().toISOString(),
  };

  const currentLocal = getLocalMeals();
  const updated = [newMeal, ...currentLocal];
  saveLocalMeals(updated);

  return { data: newMeal, isLive: false };
}

export async function deleteMealService(id: string, photoUrl: string | null): Promise<{ success: boolean; isLive: boolean }> {
  const supabase = getSupabaseClient();
  let liveSuccess = false;

  if (supabase) {
    try {
      // 1. Delete photo from storage if it belongs to supabase storage
      if (photoUrl && photoUrl.includes('meal-photos')) {
        try {
          const parts = photoUrl.split('meal-photos/');
          if (parts[1]) {
            const filePath = decodeURIComponent(parts[1].split('?')[0]);
            await supabase.storage.from('meal-photos').remove([filePath]);
          }
        } catch (storageErr) {
          console.warn('Error deleting photo from storage:', storageErr);
        }
      }

      // 2. Delete database record
      const { error } = await supabase.from('meal_ratings').delete().eq('id', id);
      if (!error) {
        liveSuccess = true;
      } else {
        console.warn('Supabase delete error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase delete exception:', err);
    }
  }

  // Always update local storage
  const currentLocal = getLocalMeals();
  const filtered = currentLocal.filter((m) => m.id !== id);
  saveLocalMeals(filtered);

  return { success: true, isLive: liveSuccess };
}

/**
 * Upload meal photo either to Supabase Storage bucket 'meal-photos' or as persistent Data URL in local mode
 */
export async function uploadMealPhotoService(file: File): Promise<{ url: string; isLive: boolean }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `uploads/${Date.now()}_${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('meal-photos').getPublicUrl(uploadData.path);
        if (urlData?.publicUrl) {
          return { url: urlData.publicUrl, isLive: true };
        }
      } else if (uploadError) {
        console.warn('Supabase storage upload error:', uploadError.message);
      }
    } catch (err) {
      console.warn('Supabase storage upload exception:', err);
    }
  }

  // Fallback: convert to base64 Data URL so local storage persists the image preview
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ url: reader.result as string, isLive: false });
    };
    reader.onerror = () => {
      resolve({ url: '', isLive: false });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Test connectivity with Supabase project
 */
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, key);
    const { error } = await tempClient.from('meal_ratings').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, but credentials are valid:
      if (error.code === '42P01' || error.message.includes('relation "meal_ratings" does not exist') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Connected to Supabase, but the table "meal_ratings" was not found. Please run the SQL schema script provided in the Setup tab.',
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Successfully connected to Supabase and verified "meal_ratings" table!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown connection error';
    return { success: false, message: msg };
  }
}

export const SUPABASE_SQL_SETUP_SCRIPT = `-- 1. Create the meal_ratings table
CREATE TABLE IF NOT EXISTS public.meal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  location TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  meal_date DATE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.meal_ratings ENABLE ROW LEVEL SECURITY;

-- 3. Anonymous Public Access Policies (Direct open access without login)
CREATE POLICY "Public anonymous users can view meals"
  ON public.meal_ratings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public anonymous users can insert meals"
  ON public.meal_ratings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public anonymous users can delete meals"
  ON public.meal_ratings
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. Create the public Storage Bucket for meal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Storage Policies for meal-photos bucket
CREATE POLICY "Public can view meal photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'meal-photos');

CREATE POLICY "Public can upload meal photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'meal-photos');

CREATE POLICY "Public can delete meal photos"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'meal-photos');
`;
