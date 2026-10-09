import React, { useState } from 'react';
import {
  X,
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import {
  SUPABASE_SQL_SETUP_SCRIPT,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection
} from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdated: () => void;
  isLiveSupabase: boolean;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdated,
  isLiveSupabase,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'credentials' | 'guide'>('sql');
  const [copied, setCopied] = useState(false);

  // Form inputs for credentials
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url || '');
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both the Supabase Project URL and Anon/Public Key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      saveSupabaseCredentials(url, anonKey);
      onCredentialsUpdated();
    }
  };

  const handleResetToDefault = () => {
    clearCustomSupabaseCredentials();
    const creds = getSupabaseCredentials();
    setUrl(creds.url);
    setAnonKey(creds.anonKey);
    setTestResult(null);
    onCredentialsUpdated();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-amber-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#FAF8F5] border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0F1E36]">
                Supabase Backend Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Setup guide, SQL migration, RLS policies, and Storage bucket for <span className="font-semibold text-amber-700">meal_ratings</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Current Status:</span>
            <span
              className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-full ${
                isLiveSupabase
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isLiveSupabase ? 'Connected to Live Supabase' : 'Running in Local Persistent Demo Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switchers */}
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                activeTab === 'sql'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              SQL Schema
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Connect Keys
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Setup Steps
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm">
          {/* TAB 1: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#0F1E36]">
                    Database Table &amp; Storage Setup SQL
                  </h4>
                  <p className="text-xs text-slate-500">
                    Copy and run this in your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-700 underline font-semibold inline-flex items-center gap-0.5">Supabase SQL Editor <ExternalLink className="w-3 h-3" /></a> to create the table, RLS policies, and storage bucket.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL Script
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[380px] leading-relaxed select-all">
                  {SUPABASE_SQL_SCRIPT_DISPLAY}
                </pre>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Security Note:</span> As specified in the requirements, no authentication is needed. The policies above enable anonymous read, insert, and delete permissions for anyone visiting the app without a login gate. Never place your Supabase service-role key in client applications.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS */}
          {activeTab === 'credentials' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              <div>
                <h4 className="font-bold text-[#0F1E36] text-base">
                  Connect Your Supabase Project
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  You can set these in your environment variables (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code>) or test with your credentials below:
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzabcdefghijklm.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon / Public Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400 bg-slate-50 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Found in Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys (anon public).
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Default Demo
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndTest}
                    disabled={isTesting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying Connection...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        Verify &amp; Save Connection
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETUP STEPS */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <h4 className="font-bold text-[#0F1E36] text-base">
                How to set up your Supabase project in 3 steps:
              </h4>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                  <div className="font-bold text-amber-900 text-sm">
                    1. Create a free project on Supabase
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Head over to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-700 underline font-semibold">supabase.com</a>, create an organization and a new project (e.g. "Meal Tracker").
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                  <div className="font-bold text-amber-900 text-sm">
                    2. Run the SQL script in SQL Editor
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Go to the <strong>SQL Editor</strong> in your Supabase dashboard, click "New query", paste the script from the "SQL Schema" tab above, and click <strong>Run</strong>. This will create the <code className="font-mono bg-white px-1 rounded">meal_ratings</code> table, RLS policies, and the <code className="font-mono bg-white px-1 rounded">meal-photos</code> public storage bucket.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                  <div className="font-bold text-amber-900 text-sm">
                    3. Connect your project
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Copy the <strong>Project URL</strong> and <strong>anon public API key</strong> from Settings &gt; API into your <code className="font-mono bg-white px-1 rounded">.env</code> or into the "Connect Keys" tab in this modal. All photos and ratings will immediately sync live!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SUPABASE_SCRIPT_COPY = SUPABASE_SQL_SETUP_SCRIPT;
const SUPABASE_SQL_SCRIPT_DISPLAY = SUPABASE_SCRIPT_COPY;
