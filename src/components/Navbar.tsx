import React from 'react';
import { UtensilsCrossed, Database, Sparkles } from 'lucide-react';

interface NavbarProps {
  isLiveSupabase: boolean;
  onOpenSetupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isLiveSupabase, onOpenSetupModal }) => {
  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-amber-100/80 sticky top-0 z-30 transition-all shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-200/60 ring-2 ring-amber-100">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0F1E36]">
                Meal Rating &amp; Tracker
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                Foodie Log
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-amber-700/90 tracking-normal">
              Eat Well. Rate Every Bite!
            </p>
          </div>
        </div>

        {/* Database Status & Setup Modal Trigger */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSetupModal}
            type="button"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all text-xs font-semibold shadow-xs hover:border-slate-300 active:scale-98"
            title="Configure Supabase Connection & SQL Schema"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="flex items-center gap-1.5">
              <span>Backend:</span>
              <span className={isLiveSupabase ? "text-emerald-700 font-bold" : "text-amber-800 font-medium"}>
                {isLiveSupabase ? "Supabase Live" : "Local Demo Storage"}
              </span>
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
