import React from 'react';
import { Calendar, ArrowUpDown, Sparkles } from 'lucide-react';
import { SortOption } from '../types/meal';

interface MealTableControlsProps {
  availableMonths: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  sortOption: SortOption;
  onSelectSort: (sort: SortOption) => void;
  mealCount: number;
}

export const MealTableControls: React.FC<MealTableControlsProps> = ({
  availableMonths,
  selectedMonth,
  onSelectMonth,
  sortOption,
  onSelectSort,
  mealCount,
}) => {
  return (
    <div className="bg-white border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-xs mb-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F1E36] tracking-tight">
              Monthly Meal Records
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Showing {mealCount} {mealCount === 1 ? 'record' : 'records'} for <span className="font-semibold text-amber-700">{selectedMonth}</span>
            </p>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Month-Year Dropdown */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] border border-amber-200/80 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <label htmlFor="month-select" className="text-xs font-semibold text-slate-600 shrink-0">
              Month:
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#0F1E36] focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="font-medium text-slate-800">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 bg-[#FAF8F5] border border-amber-200/80 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-amber-400 transition-all">
            <ArrowUpDown className="w-4 h-4 text-amber-600 shrink-0" />
            <label htmlFor="sort-select" className="text-xs font-semibold text-slate-600 shrink-0">
              Sort:
            </label>
            <select
              id="sort-select"
              value={sortOption}
              onChange={(e) => onSelectSort(e.target.value as SortOption)}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#0F1E36] focus:outline-hidden cursor-pointer"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="rating_desc">Rating (Highest to Lowest 5★ - 1★)</option>
              <option value="rating_asc">Rating (Lowest to Highest 1★ - 5★)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
