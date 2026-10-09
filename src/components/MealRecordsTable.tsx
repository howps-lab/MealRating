import React from 'react';
import { Star, MapPin, Trash2, Utensils, AlertCircle, RefreshCw, ZoomIn, PlusCircle } from 'lucide-react';
import { MealRating } from '../types/meal';
import { formatDisplayDate } from '../lib/dateUtils';

interface MealRecordsTableProps {
  meals: MealRating[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onOpenPhotoPreview: (meal: MealRating) => void;
  onRequestDelete: (meal: MealRating) => void;
  onScrollToAddForm: () => void;
  selectedMonth: string;
}

export const MealRecordsTable: React.FC<MealRecordsTableProps> = ({
  meals,
  isLoading,
  errorMessage,
  onRetry,
  onOpenPhotoPreview,
  onRequestDelete,
  onScrollToAddForm,
  selectedMonth,
}) => {
  // Star renderer helper
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= rating;
          return (
            <Star
              key={starIndex}
              className={`w-4 h-4 ${
                isFilled
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-200 fill-slate-50 stroke-slate-300'
              }`}
            />
          );
        })}
      </div>
    );
  };

  const getRatingBadgeStyle = (rating: number) => {
    if (rating >= 4) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (rating === 3) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-amber-100 rounded-2xl p-8 sm:p-12 shadow-xs mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-3 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Loading meal records...</h3>
        <p className="text-xs text-slate-500 mt-1">Fetching your delicious entries from the database</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-8 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2.5" />
        <h3 className="text-base font-bold text-rose-900">Failed to load meal records</h3>
        <p className="text-xs sm:text-sm text-rose-700 mt-1 max-w-md mx-auto">{errorMessage}</p>
        <button
          onClick={onRetry}
          type="button"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-98"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="bg-white border border-amber-100/90 rounded-2xl p-8 sm:p-12 shadow-xs mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 mx-auto flex items-center justify-center text-amber-500 mb-3.5 shadow-inner">
          <Utensils className="w-8 h-8 stroke-[1.8]" />
        </div>
        <h3 className="text-lg font-bold text-[#0F1E36]">
          No meals recorded for {selectedMonth}
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
          You haven't logged any food adventures for this month yet. Rate your latest breakfast, lunch, dinner, or cafe treat below!
        </p>
        <button
          onClick={onScrollToAddForm}
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-200 transition-all active:scale-98 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Add Your First Meal Below
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-amber-100/90 rounded-2xl shadow-xs overflow-hidden mb-8">
      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-amber-100/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {/* Columns in exact required order:
                  1. Photo
                  2. Description
                  3. Amount
                  4. Location
                  5. Rating
                  6. Date
                  7. Action
              */}
              <th scope="col" className="py-3.5 px-4 w-20">Photo</th>
              <th scope="col" className="py-3.5 px-4">Description</th>
              <th scope="col" className="py-3.5 px-4 w-32">Amount</th>
              <th scope="col" className="py-3.5 px-4">Location</th>
              <th scope="col" className="py-3.5 px-4 w-44">Rating</th>
              <th scope="col" className="py-3.5 px-4 w-36">Date</th>
              <th scope="col" className="py-3.5 px-4 text-right w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {meals.map((meal) => (
              <tr
                key={meal.id}
                className="hover:bg-amber-50/30 transition-colors group"
              >
                {/* 1. Photo */}
                <td className="py-3 px-4">
                  {meal.photo_url ? (
                    <button
                      onClick={() => onOpenPhotoPreview(meal)}
                      type="button"
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-amber-200/80 shadow-2xs group/img cursor-pointer shrink-0"
                      title="Click to view full photo"
                    >
                      <img
                        src={meal.photo_url}
                        alt={meal.description}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ZoomIn className="w-4 h-4" />
                      </div>
                    </button>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-center text-amber-400"
                      title="No photo provided"
                    >
                      <Utensils className="w-6 h-6 stroke-[1.6]" />
                    </div>
                  )}
                </td>

                {/* 2. Description */}
                <td className="py-3 px-4 font-semibold text-[#0F1E36]">
                  <span className="line-clamp-2" title={meal.description}>
                    {meal.description}
                  </span>
                </td>

                {/* 3. Amount */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="font-mono tabular-nums font-bold text-slate-800 text-sm">
                    S$ {meal.amount.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>

                {/* 4. Location */}
                <td className="py-3 px-4 text-slate-600">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="line-clamp-1" title={meal.location}>
                      {meal.location}
                    </span>
                  </div>
                </td>

                {/* 5. Rating */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {renderStars(meal.rating)}
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${getRatingBadgeStyle(
                        meal.rating
                      )}`}
                    >
                      {meal.rating}/5
                    </span>
                  </div>
                </td>

                {/* 6. Date */}
                <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-slate-600">
                  {formatDisplayDate(meal.meal_date)}
                </td>

                {/* 7. Action */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onRequestDelete(meal)}
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                    title={`Delete ${meal.description}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout for phones */}
      <div className="block md:hidden divide-y divide-amber-100/80">
        {meals.map((meal) => (
          <div key={meal.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {/* Photo */}
              {meal.photo_url ? (
                <button
                  onClick={() => onOpenPhotoPreview(meal)}
                  type="button"
                  className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-200 shrink-0 cursor-pointer"
                >
                  <img
                    src={meal.photo_url}
                    alt={meal.description}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white opacity-60">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </button>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-400 shrink-0">
                  <Utensils className="w-7 h-7 stroke-[1.6]" />
                </div>
              )}

              {/* Title, Amount, Date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#0F1E36] line-clamp-2">
                    {meal.description}
                  </h4>
                  <span className="font-mono tabular-nums font-extrabold text-amber-800 text-sm whitespace-nowrap">
                    S$ {meal.amount.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{meal.location}</span>
                </div>

                <div className="text-[11px] text-slate-400 mt-0.5">
                  {formatDisplayDate(meal.meal_date)}
                </div>
              </div>
            </div>

            {/* Rating and Delete Action Row */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {renderStars(meal.rating)}
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md border ${getRatingBadgeStyle(
                    meal.rating
                  )}`}
                >
                  {meal.rating}/5
                </span>
              </div>

              <button
                onClick={() => onRequestDelete(meal)}
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-md hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
