import React from 'react';
import { Sparkles, Radio, Bot, ShieldCheck, CheckCircle2, Zap } from 'lucide-react';

export interface VoiceOption {
  id: string;
  name: string;
  nameMm: string;
  gender: 'female' | 'male';
  tone: string;
  toneMm: string;
  description: string;
  descriptionMm: string;
  recommended?: boolean;
  provider?: 'google' | 'gemini' | 'device';
  badge?: string;
}

export const BURMESE_GOOGLE_AGENTS: VoiceOption[] = [
  {
    id: 'google-burmese-agent',
    name: 'Google Assistant (မြန်မာ Google လက်ထောက်)',
    nameMm: 'Google လက်ထောက် (တရားဝင် my-MM အသံ)',
    gender: 'female',
    tone: 'Official Google Burmese Voice',
    toneMm: 'Google တရားဝင် အသံရှင်',
    description: 'Official Google Burmese voice agent with fluent native pronunciation.',
    descriptionMm: 'Google ၏ တရားဝင် မြန်မာဘာသာ အသံရှင်ဖြင့် သဘာဝကျကျ ဖတ်ကြားပေးခြင်း။',
    recommended: true,
    provider: 'google',
    badge: 'Official Google',
  },
  {
    id: 'google-news-agent',
    name: 'Google News Agent (သတင်းကြေညာ အသံ)',
    nameMm: 'Google သတင်းကြေညာ အေဂျင်စီ',
    gender: 'female',
    tone: 'Articulate & Clear Broadcast',
    toneMm: 'သတင်းစာဖတ်ဟန် ပြတ်သားသော အသံ',
    description: 'Optimized for news broadcasts, educational articles, and reports.',
    descriptionMm: 'သတင်း၊ စာအုပ်နှင့် ဆောင်းပါးရှည်များ ဖတ်ရှုရန် အထူးသင့်လျော်။',
    provider: 'google',
    badge: 'Google News',
  },
  {
    id: 'google-maps-agent',
    name: 'Google Navigation Agent (လမ်းညွှန် အသံ)',
    nameMm: 'Google လမ်းညွှန် အေဂျင်စီ',
    gender: 'female',
    tone: 'Crisp Directions & Alerts',
    toneMm: 'ရှင်းလင်းပြတ်သားသော လမ်းညွှန်ချက် အသံ',
    description: 'Concise, distinct pacing for directions, instructions, and tutorials.',
    descriptionMm: 'ရှင်းလင်းတိုတောင်းသော လမ်းညွှန်ချက်များနှင့် ညွှန်ကြားချက်များ။',
    provider: 'google',
    badge: 'Google Maps',
  },
  {
    id: 'google-gemini-agent',
    name: 'Google Gemini Agent (ဉာဏ်ရည်တု အသံ)',
    nameMm: 'Google Gemini AI အေဂျင်စီ',
    gender: 'female',
    tone: 'Intelligent AI Companion',
    toneMm: 'ဉာဏ်ရည်တု အဖော်ပြု အသံ',
    description: 'Interactive and warm Burmese conversational voice agent.',
    descriptionMm: 'အမေးအဖြေနှင့် ဆွေးနွေးပြောဆိုမှုများအတွက် အကောင်းဆုံး။',
    provider: 'google',
    badge: 'Gemini AI',
  },
];

export const BURMESE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore (သုဝဏ္ဏီ)',
    nameMm: 'ကော်ရီ (နုပျိုကြည်လင်သော အသံ)',
    gender: 'female',
    tone: 'Clear, gentle & melodic',
    toneMm: 'ကြည်လင်အေးချမ်းသော မိန်းကလေးအသံ',
    description: 'Best for general reading, stories, and articles.',
    descriptionMm: 'ဆောင်းပါး၊ ပုံပြင်နှင့် နေ့စဉ်စာဖတ်ရှုရန် အကောင်းဆုံး။',
    recommended: true,
    provider: 'gemini',
    badge: 'Gemini 3.8',
  },
  {
    id: 'Puck',
    name: 'Puck (ဇေယျာ)',
    nameMm: 'ပတ်ခ် (သွက်လက်တက်ကြွသော အသံ)',
    gender: 'male',
    tone: 'Warm, energetic & natural',
    toneMm: 'ဖော်ရွေသွက်လက်သော ယောက်ျားလေးအသံ',
    description: 'Great for conversations, news, and modern podcasts.',
    descriptionMm: 'နေ့စဉ်စကားပြောနှင့် သတင်းများအတွက် သင့်လျော်သည်။',
    provider: 'gemini',
    badge: 'Gemini 3.8',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr (နဒီ)',
    nameMm: 'ဇက်ဖိုင်းယား (သိမ်မွေ့ငြိမ်းချမ်းသော အသံ)',
    gender: 'female',
    tone: 'Calm, soothing & expressive',
    toneMm: 'အေးချမ်းညင်သာသော အသံ',
    description: 'Ideal for bedtime stories, meditation, and poetry.',
    descriptionMm: 'တရားစာပေ၊ ကဗျာနှင့် စိတ်အပန်းပြေစေမည့် အသံ။',
    provider: 'gemini',
    badge: 'Gemini 3.8',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir (မင်းထင်)',
    nameMm: 'ဖန်ရီယာ (လေးနက်တည်ကြည်သော အသံ)',
    gender: 'male',
    tone: 'Deep, resonant & authoritative',
    toneMm: 'ဩဇာရှိပြီး လေးနက်တည်ကြည်သော အသံ',
    description: 'Perfect for documentaries, formal news, and history.',
    descriptionMm: 'တရားဝင်ကြေညာချက်နှင့် သမိုင်းစာပေများအတွက် အထူးကောင်းမွန်။',
    provider: 'gemini',
    badge: 'Gemini 3.8',
  },
  {
    id: 'Charon',
    name: 'Charon (ဦးသုခ)',
    nameMm: 'ရှာရွန် (ရင့်ကျက်တည်ငြိမ်သော အသံ)',
    gender: 'male',
    tone: 'Mature, reflective & thoughtful',
    toneMm: 'ရင့်ကျက်နွေးထွေးသော သက်ကြီးအသံ',
    description: 'Suited for traditional lore, proverbs, and philosophical essays.',
    descriptionMm: 'ရှေးရိုးရာပုံပြင်နှင့် ဆိုရိုးစကားများအတွက် သင့်လျော်။',
    provider: 'gemini',
    badge: 'Gemini 3.8',
  },
];

export interface StyleOption {
  id: string;
  name: string;
  nameMm: string;
  prompt: string;
}

export const READING_STYLES: StyleOption[] = [
  {
    id: 'conversational',
    name: 'Conversational',
    nameMm: 'နေ့စဉ်စကားပြော',
    prompt: 'Natural, fluent Burmese speaker with friendly and polite tone',
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    nameMm: 'ပုံပြင်/ဝတ္ထုပြောဟန်',
    prompt: 'Expressive Burmese storyteller with emotional pacing and engaging tone',
  },
  {
    id: 'news',
    name: 'News Broadcast',
    nameMm: 'သတင်းကြေညာသံ',
    prompt: 'Professional, articulate Burmese news anchor with formal cadence',
  },
  {
    id: 'educational',
    name: 'Educational / Slow',
    nameMm: 'သင်ကြားရေး (ရှင်းလင်းဖြည်းညှင်း)',
    prompt: 'Clear, patient Burmese teacher with articulate pronunciation and measured rhythm',
  },
  {
    id: 'mindful',
    name: 'Mindfulness / Calm',
    nameMm: 'မေတ္တာနှင့် တရားရှုမှတ်သံ',
    prompt: 'Very peaceful, gentle, meditative Burmese speaker with soothing voice',
  },
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  engineMode: 'google_agent' | 'gemini' | 'offline_device';
  onChangeEngineMode: (mode: 'google_agent' | 'gemini' | 'offline_device') => void;
  isOnline: boolean;
  language: 'my' | 'en';
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedStyle,
  onSelectStyle,
  engineMode,
  onChangeEngineMode,
  isOnline,
  language,
}) => {
  const currentVoices =
    engineMode === 'google_agent' ? BURMESE_GOOGLE_AGENTS : BURMESE_VOICES;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
      {/* Engine Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {language === 'my' ? 'အသံထွက်ပေါ်မှု စနစ် & အေဂျင်စီ' : 'Voice Agent & Engine'}
          </span>
        </div>

        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 flex-wrap gap-1">
          {/* Google Agents Button */}
          <button
            onClick={() => {
              onChangeEngineMode('google_agent');
              if (!selectedVoice.startsWith('google-')) {
                onSelectVoice('google-burmese-agent');
              }
            }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              engineMode === 'google_agent'
                ? 'bg-gradient-to-r from-blue-600 via-emerald-600 to-amber-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-blue-300" />
            <span>{language === 'my' ? 'Google အေဂျင်စီများ' : 'Google Agents'}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-bold">
              NEW
            </span>
          </button>

          {/* Gemini AI Voice Button */}
          <button
            onClick={() => {
              onChangeEngineMode('gemini');
              if (selectedVoice.startsWith('google-')) {
                onSelectVoice('Kore');
              }
            }}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              engineMode === 'gemini'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'my' ? 'Gemini 3.8 AI' : 'Gemini Studio'}</span>
          </button>

          {/* Offline Device Button */}
          <button
            onClick={() => onChangeEngineMode('offline_device')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              engineMode === 'offline_device'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{language === 'my' ? 'စက်တွင်း အော့ဖ်လိုင်း' : 'Offline Device'}</span>
          </button>
        </div>
      </div>

      {/* Engine Status Notices */}
      {engineMode === 'google_agent' && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>{language === 'my' ? 'Google Burmese Agents စနစ် အသက်ဝင်နေပါသည်' : 'Google Burmese Agents Active'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                my-MM
              </span>
            </span>
            <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">
              {language === 'my'
                ? 'Google ၏ တရားဝင် မြန်မာဘာသာ အသံနည်းပညာဖြင့် တိုက်ရိုက်ဖန်တီးပေးပါသည်။ အသံထွက်ပြတ်သားပြီး သဘာဝကျသော သံနေသံထားကို ပေးစွမ်းနိုင်ပါသည်။'
                : 'Synthesizes directly with official Google Burmese speech agents. High clarity, zero rate-limit constraints, and natural flow.'}
            </p>
          </div>
        </div>
      )}

      {engineMode === 'offline_device' && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-100">
              {language === 'my' ? 'အော့ဖ်လိုင်း စနစ်ဖွင့်ထားပါသည်' : 'Offline Device Speech Engine Active'}
            </span>
            <p className="mt-0.5 text-slate-400 text-[11px]">
              {language === 'my'
                ? 'အင်တာနက်မလိုဘဲ သင့်စက်တွင်း အသံစနစ်ဖြင့် တိုက်ရိုက်ဖတ်ကြားပေးပါမည်။ လစဉ်စကားလုံးခွဲတမ်း မကုန်ဆုံးပါ။'
                : 'Synthesizes directly on your device via acoustic synthesis & Web Speech API. Zero internet required, zero quota consumed.'}
            </p>
          </div>
        </div>
      )}

      {/* Voice Personas Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {engineMode === 'google_agent' ? (
              <span className="text-blue-300 font-bold">
                {language === 'my' ? 'Google မြန်မာ အေဂျင်စီ အသံရှင်များ' : 'Google Burmese Voice Agents'}
              </span>
            ) : (
              <span>{language === 'my' ? 'မြန်မာ အသံရှင် ရွေးချယ်ပါ' : 'Select Burmese Voice Persona'}</span>
            )}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            {currentVoices.length} {language === 'my' ? 'ဦး ရရှိနိုင်ပါသည်' : 'voices available'}
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2.5">
          {currentVoices.map((v) => {
            const isSelected = selectedVoice === v.id;
            const isGoogle = v.provider === 'google';

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVoice(v.id)}
                className={`p-3.5 rounded-xl border text-left transition relative cursor-pointer ${
                  isSelected
                    ? isGoogle
                      ? 'bg-blue-500/15 border-blue-400 shadow-md shadow-blue-500/10'
                      : 'bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Badge */}
                {v.badge && (
                  <span
                    className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isGoogle
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {v.badge}
                  </span>
                )}

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isGoogle
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm'
                        : v.gender === 'female'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {isGoogle ? <Bot className="w-4 h-4" /> : v.gender === 'female' ? 'F' : 'M'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{language === 'my' ? v.nameMm : v.name}</span>
                    </h5>
                    <p
                      className={`text-[11px] font-medium ${
                        isGoogle ? 'text-blue-300' : 'text-amber-300/90'
                      }`}
                    >
                      {language === 'my' ? v.toneMm : v.tone}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400 leading-snug">
                  {language === 'my' ? v.descriptionMm : v.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reading Style Presets (For Gemini & Google Agents) */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <label className="text-xs font-semibold text-slate-300">
          {language === 'my' ? 'ဖတ်ကြားဟန် ပုံစံ' : 'Reading Style & Cadence'}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {READING_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedStyle === style.id
                  ? engineMode === 'google_agent'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {language === 'my' ? style.nameMm : style.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
