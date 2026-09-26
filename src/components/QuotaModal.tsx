import React from 'react';
import {
  X,
  PieChart,
  Calendar,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Sparkles,
  TrendingUp,
  History,
  Play,
  Download,
} from 'lucide-react';

export interface QuotaHistoryItem {
  id: string;
  title: string;
  wordCount: number;
  voice: string;
  speed: number;
  timestamp: number;
  audioUrl?: string;
}

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaUsed: number;
  quotaLimit: number;
  history: QuotaHistoryItem[];
  onPlayHistoryItem: (item: QuotaHistoryItem) => void;
  language: 'my' | 'en';
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  isOpen,
  onClose,
  quotaUsed,
  quotaLimit,
  history,
  onPlayHistoryItem,
  language,
}) => {
  if (!isOpen) return null;

  const remaining = Math.max(0, quotaLimit - quotaUsed);
  const percentUsed = Math.min(100, (quotaUsed / quotaLimit) * 100);

  // Compute days until end of current month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const diffDays = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {language === 'my'
                  ? 'လစဉ် စကားလုံး ၁၀၀,၀၀၀ အခမဲ့ ခွဲတမ်း'
                  : '100,000 Free Monthly Words Quota'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'my'
                  ? 'လစဉ် အခမဲ့ အသံဖန်တီးနိုင်သည့် စကားလုံး ပမာဏ'
                  : 'Monthly word allowance tracker & conversion history'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Stats Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Words Left Highlight */}
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {language === 'my' ? 'လက်ကျန် အခမဲ့ စကားလုံး' : 'Remaining Free Words'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono text-amber-400">
                    {remaining.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-sm">
                    / {quotaLimit.toLocaleString()} {language === 'my' ? 'လုံး' : 'words'}
                  </span>
                </div>
              </div>

              {/* Reset Countdown */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>
                  {language === 'my'
                    ? `နောက်ထပ် ${diffDays} ရက်အကြာတွင် အသစ်ပြန်စပါမည်`
                    : `Resets in ${diffDays} days on the 1st`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>{percentUsed.toFixed(1)}% used</span>
                <span>{(100 - percentUsed).toFixed(1)}% available</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700/80 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>

            {/* Quota Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300">
                  {language === 'my' ? '၁၀၀% အခမဲ့ဖြစ်သည်' : '100% Free every month'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-300">
                  {language === 'my' ? 'အော့ဖ်လိုင်းနားထောင်ခြင်း မကုန်' : 'Offline reading uses 0 words'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-slate-300">
                  {language === 'my' ? 'လဆန်းတိုင်း အလိုအလျောက်ပြည့်' : 'Refills every month'}
                </span>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {language === 'my' ? 'မကြာသေးမီက အသံဖန်တီးမှု မှတ်တမ်း' : 'Recent Conversion History'}
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {history.length} items
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                {language === 'my'
                  ? 'မှတ်တမ်း မရှိသေးပါ။ မြန်မာစာသားကို အသံပြောင်းကြည့်ပါ။'
                  : 'No conversion history yet. Try converting some Burmese text!'}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-semibold text-slate-200 truncate burmese-font">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="font-mono text-amber-300 font-medium">
                          {item.wordCount} words
                        </span>
                        <span>•</span>
                        <span>{item.voice}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {item.audioUrl && (
                      <button
                        onClick={() => {
                          onPlayHistoryItem(item);
                          onClose();
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                        title="Replay Audio"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {language === 'my' ? 'ပိတ်ရန်' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
