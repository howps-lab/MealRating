/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { MealTableControls } from './components/MealTableControls';
import { MealRecordsTable } from './components/MealRecordsTable';
import { AddMealForm } from './components/AddMealForm';
import { PhotoModal } from './components/PhotoModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { MealRating, SortOption, SummaryStats } from './types/meal';
import {
  getCurrentMonthYear,
  getAvailableMonths,
  isDateInMonthYear,
} from './lib/dateUtils';
import {
  fetchMealsService,
  deleteMealService,
} from './lib/supabase';
import heroSpreadImg from './assets/images/hero_food_spread_1791518790659.jpg';
import { Utensils, ChefHat } from 'lucide-react';

export default function App() {
  // Global meals state
  const [allMeals, setAllMeals] = useState<MealRating[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);

  // Month filtering & sorting state
  // Default to the current month-year even if there are no records for that month
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthYear());
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Modals state
  const [photoPreviewMeal, setPhotoPreviewMeal] = useState<MealRating | null>(null);
  const [deleteTargetMeal, setDeleteTargetMeal] = useState<MealRating | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  // Load records from Supabase / persistent store
  const loadMealRecords = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const result = await fetchMealsService();
      setAllMeals(result.data);
      setIsLiveSupabase(result.isLive);
      if (result.error && result.data.length === 0) {
        setFetchError(result.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch meal records.';
      setFetchError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMealRecords();
  }, [loadMealRecords]);

  // Compute available months from meal records + current month
  const availableMonths = useMemo(() => {
    const dates = allMeals.map((m) => m.meal_date);
    return getAvailableMonths(dates, getCurrentMonthYear());
  }, [allMeals]);

  // Ensure selectedMonth stays valid
  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      // If the current selected month disappeared, fall back to current month
      const current = getCurrentMonthYear();
      if (availableMonths.includes(current)) {
        setSelectedMonth(current);
      } else if (availableMonths.length > 0) {
        setSelectedMonth(availableMonths[0]);
      }
    }
  }, [availableMonths, selectedMonth]);

  // Filter records by selected month
  const monthlyFilteredMeals = useMemo(() => {
    return allMeals.filter((meal) => isDateInMonthYear(meal.meal_date, selectedMonth));
  }, [allMeals, selectedMonth]);

  // Sort filtered records
  const sortedAndFilteredMeals = useMemo(() => {
    const list = [...monthlyFilteredMeals];

    if (sortOption === 'rating_desc') {
      // Highest to lowest rating
      return list.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.meal_date).getTime() - new Date(a.meal_date).getTime();
      });
    }

    if (sortOption === 'rating_asc') {
      // Lowest to highest rating
      return list.sort((a, b) => {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return new Date(b.meal_date).getTime() - new Date(a.meal_date).getTime();
      });
    }

    // Default: meal date newest first
    return list.sort((a, b) => {
      const timeA = new Date(a.meal_date).getTime();
      const timeB = new Date(b.meal_date).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [monthlyFilteredMeals, sortOption]);

  // Calculate Summary Cards stats for the selected month
  const summaryStats: SummaryStats = useMemo(() => {
    const totalMeals = monthlyFilteredMeals.length;
    if (totalMeals === 0) {
      return { totalMeals: 0, averageRating: 0, totalSpending: 0 };
    }

    const totalRating = monthlyFilteredMeals.reduce((acc, m) => acc + m.rating, 0);
    const averageRating = totalRating / totalMeals;

    const totalSpending = monthlyFilteredMeals.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    return {
      totalMeals,
      averageRating,
      totalSpending,
    };
  }, [monthlyFilteredMeals]);

  // Handler when a new meal is added
  const handleMealAdded = (newMeal: MealRating, targetMonth: string) => {
    setAllMeals((prev) => [newMeal, ...prev]);

    // If the newly added meal belongs to a different month than current selected month,
    // switch the dropdown to that meal's month so the new record is visible
    if (selectedMonth !== targetMonth) {
      setSelectedMonth(targetMonth);
    }
  };

  // Handler for delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTargetMeal) return;

    setIsDeleting(true);
    try {
      await deleteMealService(deleteTargetMeal.id, deleteTargetMeal.photo_url);
      setAllMeals((prev) => prev.filter((m) => m.id !== deleteTargetMeal.id));
      setDeleteTargetMeal(null);
    } catch (err) {
      console.error('Failed to delete meal record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById('add-meal-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F1E36] flex flex-col font-sans selection:bg-amber-200">
      {/* 1. Header & Navigation */}
      <Navbar
        isLiveSupabase={isLiveSupabase}
        onOpenSetupModal={() => setIsSetupModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Cheerful Hero Banner with food photography inspiration */}
        <section className="mb-7 relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shadow-md shadow-orange-200/50 text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            {/* Banner Text */}
            <div className="p-6 sm:p-8 md:col-span-7 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold tracking-wide mb-3">
                <ChefHat className="w-3.5 h-3.5" />
                <span>Culinary Diary &amp; Reviewer</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-xs">
                Eat Well. Rate Every Bite!
              </h2>
              <p className="mt-2 text-white/90 text-xs sm:text-sm font-medium leading-relaxed max-w-lg">
                Track your culinary discoveries, rate flavours from 1 to 5 stars, log dining spending in SGD, and build your personal foodie gallery.
              </p>

              {/* Quick Jump Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={scrollToForm}
                  className="px-4 py-2 rounded-xl bg-white text-[#0F1E36] font-bold text-xs sm:text-sm shadow-md hover:bg-amber-50 transition-all active:scale-98 cursor-pointer"
                >
                  Rate Latest Meal ↓
                </button>
                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-black/20 hover:bg-black/30 backdrop-blur-xs text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 cursor-pointer"
                >
                  Supabase Setup &amp; SQL
                </button>
              </div>
            </div>

            {/* Banner Photo */}
            <div className="relative md:col-span-5 h-48 md:h-full min-h-[220px] overflow-hidden">
              <img
                src={heroSpreadImg}
                alt="Vibrant gourmet food spread"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transform md:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-orange-500/80 via-transparent to-transparent md:from-orange-500/90" />
            </div>
          </div>
        </section>

        {/* SECTION A: MEAL RECORDS TABLE — AT THE TOP */}
        <section aria-label="Meal Records Section" className="mb-12">
          {/* Summary Cards */}
          <SummaryCards stats={summaryStats} selectedMonth={selectedMonth} />

          {/* Table Controls (Month Dropdown & Sort Selector) */}
          <MealTableControls
            availableMonths={availableMonths}
            selectedMonth={selectedMonth}
            onSelectMonth={(m) => setSelectedMonth(m)}
            sortOption={sortOption}
            onSelectSort={(s) => setSortOption(s)}
            mealCount={sortedAndFilteredMeals.length}
          />

          {/* Table of Records */}
          <MealRecordsTable
            meals={sortedAndFilteredMeals}
            isLoading={isLoading}
            errorMessage={fetchError}
            onRetry={loadMealRecords}
            onOpenPhotoPreview={(meal) => setPhotoPreviewMeal(meal)}
            onRequestDelete={(meal) => setDeleteTargetMeal(meal)}
            onScrollToAddForm={scrollToForm}
            selectedMonth={selectedMonth}
          />
        </section>

        {/* SECTION B: ADD MEAL RECORD FORM — AT THE BOTTOM */}
        <AddMealForm
          onMealAdded={handleMealAdded}
          currentSelectedMonth={selectedMonth}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-amber-100 bg-white/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Utensils className="w-4 h-4 text-amber-500" />
            <span>Meal Rating &amp; Tracker</span>
            <span className="text-slate-400 font-normal">·</span>
            <span className="text-slate-500 font-normal">Eat Well. Rate Every Bite!</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Powered by Supabase PostgreSQL &amp; Storage</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PhotoModal
        meal={photoPreviewMeal}
        onClose={() => setPhotoPreviewMeal(null)}
      />

      <DeleteConfirmModal
        meal={deleteTargetMeal}
        isOpen={deleteTargetMeal !== null}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetMeal(null)}
      />

      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onCredentialsUpdated={loadMealRecords}
        isLiveSupabase={isLiveSupabase}
      />
    </div>
  );
}
