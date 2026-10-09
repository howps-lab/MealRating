import React from 'react';
import { X, MapPin, Star, Calendar } from 'lucide-react';
import { MealRating } from '../types/meal';
import { formatDisplayDate } from '../lib/dateUtils';

interface PhotoModalProps {
  meal: MealRating | null;
  onClose: () => void;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ meal, onClose }) => {
  if (!meal || !meal.photo_url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-amber-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
          aria-label="Close photo preview"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo view */}
        <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden max-h-[60vh]">
          <img
            src={meal.photo_url}
            alt={meal.description}
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[60vh] object-contain"
          />
        </div>

        {/* Meal details footer */}
        <div className="p-5 sm:p-6 bg-white flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0F1E36]">
                {meal.description}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{meal.location}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-amber-800">
                S$ {meal.amount.toFixed(2)}
              </span>
              <div className="text-[11px] text-slate-400 font-medium">SGD</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {/* Stars */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= meal.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-slate-100'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                {meal.rating} / 5 Stars
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{formatDisplayDate(meal.meal_date)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
