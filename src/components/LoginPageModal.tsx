import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, Bot, PieChart, Award, AlertCircle } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';

interface LoginPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  language: 'my' | 'en';
}

export const LoginPageModal: React.FC<LoginPageModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  language,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await loginWithGoogle();
      if (user) {
        onLoginSuccess?.();
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err?.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 my-8 animate-scale-up">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              ရွှေ
            </div>
            <span className="font-extrabold text-base bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              ShweVoice Account
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {language === 'my'
                ? 'Google အကောင့်ဖြင့် ဝင်ရောက်ပါ'
                : 'Sign in with Google'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
              {language === 'my'
                ? 'လစဉ် စကားလုံး ၁၀၀,၀၀၀ ခွဲတမ်းနှင့် အသံဖန်တီးမှုတိုင်းအတွက် အချက်အလက်များ သိမ်းဆည်းရန်'
                : 'Sync your 100,000 monthly words quota and claim data for every audio activity'}
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-start gap-2.5">
              <PieChart className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">
                  {language === 'my' ? 'လစဉ် စကားလုံး ၁၀၀,၀၀၀ အခမဲ့ ခွဲတမ်း' : '100,000 Words / Month Quota'}
                </span>
                <p className="text-slate-400 text-[11px]">
                  {language === 'my' ? 'သင့် Google အကောင့်တွင် လုံခြုံစွာ မှတ်သားထားပါမည်' : 'Securely tracked and refreshed every month'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">
                  {language === 'my' ? 'အသံတိုင်းအတွက် Claim Data ရယူရန်' : 'Claim Data for Every Audio'}
                </span>
                <p className="text-slate-400 text-[11px]">
                  {language === 'my' ? 'ဖတ်ကြားထားသော အသံတိုင်းအတွက် မှတ်တမ်းနှင့် ဆုလာဘ်မှတ်များ Claim နိုင်သည်' : 'Claim points, track listening history, and save activities'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200">
                  {language === 'my' ? 'Google Burmese Agents & Gemini AI' : 'Google Burmese Agents & AI Studio'}
                </span>
                <p className="text-slate-400 text-[11px]">
                  {language === 'my' ? 'သဘာဝ အသံရှင်များနှင့် အော့ဖ်လိုင်း စာကြည့်တိုက် အပြည့်အစုံ' : 'Official native my-MM voices and cross-device sync'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {/* Official Google G Logo */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>
              {isLoading
                ? language === 'my'
                  ? 'ဝင်ရောက်နေပါသည်...'
                  : 'Connecting to Google...'
                : language === 'my'
                ? 'Google ဖြင့် ဆက်လက်ဆောင်ရွက်ရန်'
                : 'Continue with Google'}
            </span>
          </button>

          <p className="text-center text-[11px] text-slate-500">
            {language === 'my'
              ? 'ဝင်ရောက်ခြင်းဖြင့် ShweVoice ၏ စည်းကမ်းချက်များကို သဘောတူပြီးဖြစ်ပါသည်'
              : 'By signing in, you agree to ShweVoice terms & privacy.'}
          </p>
        </div>
      </div>
    </div>
  );
};
