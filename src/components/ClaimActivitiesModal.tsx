import React, { useState } from 'react';
import {
  X,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Play,
  Bot,
  Zap,
  Gift,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { CloudAudioActivity, claimActivityReward } from '../lib/firebase';

interface ClaimActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: CloudAudioActivity[];
  userId: string | null;
  onPlayActivity: (activity: CloudAudioActivity) => void;
  onActivityClaimed?: () => void;
  claimPoints: number;
  language: 'my' | 'en';
}

export const ClaimActivitiesModal: React.FC<ClaimActivitiesModalProps> = ({
  isOpen,
  onClose,
  activities,
  userId,
  onPlayActivity,
  onActivityClaimed,
  claimPoints,
  language,
}) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  if (!isOpen) return null;

  const unclaimedActivities = activities.filter((a) => !a.claimed);
  const totalUnclaimedTokens = unclaimedActivities.reduce((sum, a) => sum + (a.claimTokens || 10), 0);

  const handleClaimSingle = async (activity: CloudAudioActivity) => {
    if (!userId || activity.claimed) return;
    try {
      setClaimingId(activity.id);
      await claimActivityReward(userId, activity.id, activity.claimTokens || 10, activity.wordCount);
      onActivityClaimed?.();
    } catch (err) {
      console.error('Error claiming activity:', err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimAll = async () => {
    if (!userId || unclaimedActivities.length === 0) return;
    try {
      setIsClaimingAll(true);
      for (const act of unclaimedActivities) {
        await claimActivityReward(userId, act.id, act.claimTokens || 10, act.wordCount);
      }
      onActivityClaimed?.();
    } catch (err) {
      console.error('Error claiming all activities:', err);
    } finally {
      setIsClaimingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 text-slate-100 max-h-[90vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>
                  {language === 'my'
                    ? 'အသံဖန်တီးမှုတိုင်းအတွက် Claim Data'
                    : 'Claim Data for Audio Activities'}
                </span>
                {unclaimedActivities.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    {unclaimedActivities.length} {language === 'my' ? 'ခု ရယူနိုင်' : 'ready to claim'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'my'
                  ? 'အသံထုတ်လုပ်ထားသော မှတ်တမ်းတိုင်းကို အတည်ပြုပြီး ဆုလာဘ်မှတ်များ ရယူပါ'
                  : 'Claim points & verify records for every Burmese audio activity'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats & Claim All Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border-b border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === 'my' ? 'လက်ကျန် Claim မှတ်များ' : 'Your Claim Points'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {claimPoints.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-medium">pts</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === 'my' ? 'အသံလှုပ်ရှားမှု စုစုပေါင်း' : 'Total Activities'}
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-mono text-slate-100">
                  {activities.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">items</span>
              </div>
            </div>

            <div className="flex items-center">
              {unclaimedActivities.length > 0 ? (
                <button
                  onClick={handleClaimAll}
                  disabled={isClaimingAll}
                  className="w-full h-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Gift className="w-4 h-4" />
                  <span>
                    {isClaimingAll
                      ? language === 'my'
                        ? 'ရယူနေပါသည်...'
                        : 'Claiming...'
                      : language === 'my'
                      ? `အားလုံး Claim ရန် (+${totalUnclaimedTokens} pts)`
                      : `Claim All (+${totalUnclaimedTokens} pts)`}
                  </span>
                </button>
              ) : (
                <div className="w-full h-full p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'my' ? 'အားလုံး Claim ပြီးပါပြီ' : 'All Data Claimed!'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {activities.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
              <Award className="w-8 h-8 text-slate-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-300">
                {language === 'my' ? 'လှုပ်ရှားမှု မရှိသေးပါ' : 'No Audio Activities Yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {language === 'my'
                  ? 'မြန်မာစာသားကို အသံဖန်တီးပြီးပါက ဤနေရာတွင် Activity မှတ်တမ်းအဖြစ် ပေါ်လာမည်ဖြစ်ပြီး Claim နိုင်ပါသည်'
                  : 'Synthesize any Burmese text and its activity will be securely recorded here to claim points and data.'}
              </p>
            </div>
          ) : (
            activities.map((act) => {
              const isGoogle = act.provider === 'google_agent' || act.voice.startsWith('google-');
              return (
                <div
                  key={act.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    act.claimed
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-80'
                      : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40 shadow-sm'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isGoogle
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {act.voice}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400">
                        {act.speed}x • {act.wordCount} words
                      </span>

                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h5 className="text-xs sm:text-sm font-semibold text-slate-100 truncate burmese-font">
                      {act.title}
                    </h5>

                    <p className="text-[11px] text-slate-400 line-clamp-1 burmese-font">
                      {act.text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Play Audio Button */}
                    {act.audioUrl && (
                      <button
                        onClick={() => {
                          onPlayActivity(act);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title="Replay Audio"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    {/* Claim Button */}
                    {act.claimed ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'my' ? 'Claim ပြီး' : 'Claimed'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaimSingle(act)}
                        disabled={claimingId === act.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>
                          {claimingId === act.id
                            ? 'Claiming...'
                            : language === 'my'
                            ? `Claim ရယူရန် (+${act.claimTokens || 10})`
                            : `Claim (+${act.claimTokens || 10} pts)`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {language === 'my'
              ? 'အသံလှုပ်ရှားမှုများကို သင့် Google Account ဖြင့် အလိုအလျောက် ထိန်းသိမ်းပေးထားပါသည်'
              : 'Synced securely with Firebase Firestore to your Google Account'}
          </span>
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
