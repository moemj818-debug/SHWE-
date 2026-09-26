import React, { useState } from 'react';
import {
  Volume2,
  Wifi,
  WifiOff,
  HardDrive,
  Download,
  Sparkles,
  PieChart,
  Globe,
  Award,
  User,
  LogOut,
  Gift,
  ChevronDown,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { UserProfile } from '../lib/firebase';

interface NavbarProps {
  quotaUsed: number;
  quotaLimit: number;
  onOpenQuotaModal: () => void;
  onOpenOfflineLibrary: () => void;
  offlineCount: number;
  language: 'my' | 'en';
  onToggleLanguage: () => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
  onOpenClaimModal: () => void;
  unclaimedCount: number;
  claimPoints: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  quotaUsed,
  quotaLimit,
  onOpenQuotaModal,
  onOpenOfflineLibrary,
  offlineCount,
  language,
  onToggleLanguage,
  user,
  onOpenLogin,
  onOpenClaimModal,
  unclaimedCount,
  claimPoints,
  onLogout,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const remaining = Math.max(0, quotaLimit - quotaUsed);
  const percentUsed = Math.min(100, Math.round((quotaUsed / quotaLimit) * 100));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 shadow-lg shadow-amber-500/20 text-slate-950">
              <Volume2 className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  ShweVoice
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {language === 'my' ? 'မြန်မာ' : 'Burmese TTS'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden sm:block">
                {language === 'my' ? 'သဘာဝကျသော မြန်မာအသံ ထွက်ပေါ်စနစ်' : 'Natural Voice Synthesis & Reader'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online / Offline status badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              }`}
              title={isOnline ? 'Online' : 'Offline Mode'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">{language === 'my' ? 'အွန်လိုင်း' : 'Online'}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{language === 'my' ? 'အော့ဖ်လိုင်း' : 'Offline'}</span>
                </>
              )}
            </div>

            {/* Monthly Quota Badge (100,000 words) */}
            <button
              onClick={onOpenQuotaModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs transition shadow-sm hover:border-amber-500/40 group cursor-pointer"
              title="100,000 Free Words Monthly Quota"
            >
              <PieChart className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-amber-300">
                  {remaining.toLocaleString()}
                </span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {language === 'my' ? 'လုံးကျန်' : 'words left'}
                </span>
              </div>
              <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden md:block border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </button>

            {/* Claim Data Button */}
            <button
              onClick={onOpenClaimModal}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer shadow-sm"
              title="Claim data and rewards for audio activities"
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {language === 'my' ? 'Claim Data' : 'Claim Data'}
              </span>
              {unclaimedCount > 0 ? (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 animate-pulse">
                  {unclaimedCount}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-400">
                  {claimPoints} pts
                </span>
              )}
            </button>

            {/* Offline Audio Library button */}
            <button
              onClick={onOpenOfflineLibrary}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs transition hover:border-indigo-500/40 cursor-pointer"
              title="Offline Audio Library"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">
                {language === 'my' ? 'စာကြည့်တိုက်' : 'Saved Audio'}
              </span>
              {offlineCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  {offlineCount}
                </span>
              )}
            </button>

            {/* User Profile / Login with Google */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 transition cursor-pointer"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-7 h-7 rounded-lg object-cover border border-amber-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-scale-up">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {user.membership || '100,000 Words / Mo'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenClaimModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'my' ? 'Claim Data & ဆုလာဘ်များ' : 'Claim Data & Rewards'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenQuotaModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
                    >
                      <PieChart className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'my' ? 'ခွဲတမ်း စစ်ဆေးရန်' : 'Quota Analytics'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/40 text-xs font-medium text-rose-400 flex items-center gap-2 transition mt-1 border-t border-slate-800 pt-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'my' ? 'ထွက်ရန်' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md shadow-white/10 transition cursor-pointer active:scale-95"
              >
                {/* Google G logo */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {language === 'my' ? 'Google ဖြင့် ဝင်ရန်' : 'Sign In'}
                </span>
              </button>
            )}

            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-semibold shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'my' ? 'အက်ပ်သွင်းရန်' : 'Install'}
                </span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">iOS</span>
              </button>
            )}

            {/* Language Switch */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs text-slate-300 transition cursor-pointer"
              title="Toggle Myanmar / English"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-amber-300">
                {language === 'my' ? 'EN' : 'မြန်မာ'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {language === 'my' ? 'iPhone / iPad တွင် ထည့်သွင်းရန်' : 'Install on iPhone / iPad'}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              {language === 'my' ? (
                <>
                  ၁။ Safari အောက်ဘက်ရှိ <strong>Share (မျှဝေရန်)</strong> ခလုတ်ကို နှိပ်ပါ။<br />
                  ၂။ အောက်သို့ဆွဲချပြီး <strong>Add to Home Screen (ပင်မစာမျက်နှာသို့ ထည့်ရန်)</strong> ကို နှိပ်ပါ။
                </>
              ) : (
                <>
                  1. Tap the <strong>Share</strong> icon in the Safari toolbar.<br />
                  2. Scroll down and choose <strong>Add to Home Screen</strong>.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2 text-xs transition"
            >
              {language === 'my' ? 'နားလည်ပါပြီ' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
