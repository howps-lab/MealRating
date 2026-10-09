import React from 'react';
import { Utensils, Star, DollarSign } from 'lucide-react';
import { SummaryStats } from '../types/meal';

interface SummaryCardsProps {
  stats: SummaryStats;
  selectedMonth: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, selectedMonth }) => {
  const { totalMeals, averageRating, totalSpending } = stats;

  // Rating color coding: green for high (>= 4.0), orange for moderate (>= 3.0), red/coral for low (< 3.0)
  const getRatingColorClasses = (avg: number) => {
    if (totalMeals === 0) {
      return {
        badgeBg: 'bg-slate-100 text-slate-600',
        starFill: 'text-slate-400',
        textColor: 'text-slate-800',
      };
    }
    if (avg >= 4.0) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        starFill: 'text-emerald-500 fill-emerald-500',
        textColor: 'text-emerald-950',
      };
    }
    if (avg >= 3.0) {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        starFill: 'text-amber-500 fill-amber-500',
        textColor: 'text-amber-950',
      };
    }
    return {
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      starFill: 'text-rose-500 fill-rose-500',
      textColor: 'text-rose-950',
    };
  };

  const ratingStyles = getRatingColorClasses(averageRating);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 my-4">
      {/* 1. Total Meals Card */}
      <div className="relative overflow-hidden bg-white border border-amber-100/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Total Meals
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Utensils className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#0F1E36] font-mono tabular-nums tracking-tight">
            {totalMeals}
          </span>
          <span className="text-xs font-medium text-slate-500">
            logged in {selectedMonth}
          </span>
        </div>
      </div>

      {/* 2. Average Rating Card */}
      <div className="relative overflow-hidden bg-white border border-amber-100/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Average Rating
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-600" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <span className={`text-3xl font-extrabold font-mono tabular-nums tracking-tight ${ratingStyles.textColor}`}>
            {totalMeals > 0 ? averageRating.toFixed(1) : '—'}
          </span>
          {totalMeals > 0 && (
            <div className="flex items-center gap-1">
              <Star className={`w-5 h-5 ${ratingStyles.starFill}`} />
              <span className="text-xs font-medium text-slate-500">/ 5.0</span>
            </div>
          )}
          {totalMeals === 0 && (
            <span className="text-xs font-medium text-slate-400">No ratings yet</span>
          )}
        </div>
      </div>

      {/* 3. Total Spending Card */}
      <div className="relative overflow-hidden bg-white border border-amber-100/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Total Spending
          </span>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <DollarSign className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-slate-500 font-mono">S$</span>
          <span className="text-3xl font-extrabold text-[#0F1E36] font-mono tabular-nums tracking-tight">
            {totalSpending.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-medium text-slate-400">SGD</span>
        </div>
      </div>
    </div>
  );
};
