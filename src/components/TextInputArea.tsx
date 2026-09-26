import React, { useRef } from 'react';
import {
  FileText,
  Upload,
  ClipboardPaste,
  Trash2,
  Copy,
  Sparkles,
  AlertCircle,
  Clock,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { SAMPLE_BURMESE_TEXTS, SampleText } from '../lib/sampleTexts';
import { BurmeseAnalysis, formatSecondsToTime } from '../lib/burmeseTokenizer';

interface TextInputAreaProps {
  text: string;
  onChangeText: (text: string) => void;
  analysis: BurmeseAnalysis;
  speed: number;
  remainingQuota: number;
  isLoading: boolean;
  onGenerate: () => void;
  language: 'my' | 'en';
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onChangeText,
  analysis,
  speed,
  remainingQuota,
  isLoading,
  onGenerate,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isExceedingQuota = analysis.words > remainingQuota;
  const quotaPercentOfCurrent = Math.min(100, (analysis.words / 100000) * 100);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onChangeText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        onChangeText(text ? `${text}\n${clipboardText}` : clipboardText);
      }
    } catch {
      // Ignore if clipboard permissions are restricted
    }
  };

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleSelectSample = (sample: SampleText) => {
    onChangeText(sample.text);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 backdrop-blur-md">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {language === 'my' ? 'မြန်မာ စာသား ရိုက်ထည့်ရန်' : 'Burmese Script Input'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* File Upload (.txt) */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.text"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
            title="Import text file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{language === 'my' ? 'ဖိုင်ထည့်ရန်' : 'Import'}</span>
          </button>

          {/* Paste */}
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{language === 'my' ? 'ကူးယူထည့်ရန်' : 'Paste'}</span>
          </button>

          {/* Copy */}
          {text && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
              title="Copy text"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {/* Clear */}
          {text && (
            <button
              type="button"
              onClick={() => onChangeText('')}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/40 border border-slate-800 text-xs text-rose-400 transition"
              title="Clear all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sample Texts Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <BookOpen className="w-3 h-3 text-amber-400" />
          <span>{language === 'my' ? 'နမူနာ မြန်မာစာသားများ ရွေးချယ်ဖတ်ရှုရန်:' : 'Try Authentic Sample Texts:'}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SAMPLE_BURMESE_TEXTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 text-left transition group"
            >
              <div className="text-[11px] font-medium text-slate-300 group-hover:text-amber-300 flex items-center gap-1">
                <span>{language === 'my' ? sample.titleMm : sample.title}</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {language === 'my' ? sample.categoryMm : sample.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={
            language === 'my'
              ? 'ဤနေရာတွင် မြန်မာစာသားကို ရိုက်ထည့်ပါ သို့မဟုတ် ကူးယူထည့်သွင်းပါ... (ဥပမာ- မင်္ဂလာပါရှင်။ နေကောင်းကြပါရဲ့လား။)'
              : 'Type or paste Burmese text here... (e.g. မင်္ဂလာပါရှင်။ နေကောင်းကြပါရဲ့လား။)'
          }
          className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 burmese-font text-base sm:text-lg leading-relaxed resize-y transition shadow-inner"
        />

        {/* Floating Quota Tag */}
        {text && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none">
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border backdrop-blur-sm ${
                isExceedingQuota
                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900/90 text-amber-300 border-slate-700'
              }`}
            >
              {analysis.words} {language === 'my' ? 'လုံး' : 'words'}
            </span>
          </div>
        )}
      </div>

      {/* Metrics & Quota Info Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {language === 'my' ? 'စကားလုံး ခန့်မှန်း' : 'Est. Words'}
          </span>
          <span className="text-sm font-bold font-mono text-amber-300">
            {analysis.words.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {language === 'my' ? 'သံပြတ် / ဝဏ္ဏ' : 'Syllables'}
          </span>
          <span className="text-sm font-bold font-mono text-slate-200">
            {analysis.syllables.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            {language === 'my' ? 'အက္ခရာ စုစုပေါင်း' : 'Characters'}
          </span>
          <span className="text-sm font-bold font-mono text-slate-200">
            {analysis.characters.toLocaleString()}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {language === 'my' ? 'ကြာချိန်' : 'Est. Time'}
          </span>
          <span className="text-sm font-bold font-mono text-amber-400">
            {formatSecondsToTime(analysis.estimatedSeconds)}
          </span>
        </div>
      </div>

      {/* Quota Impact Warning or Status */}
      {isExceedingQuota ? (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            {language === 'my'
              ? `သတိပေးချက်- ဤစာသားသည် လစဉ်အခမဲ့ခွဲတမ်းထက် ကျော်လွန်နေပါသည် (လက်ကျန်: ${remainingQuota.toLocaleString()} လုံး)`
              : `Warning: Input exceeds your remaining free monthly words (${remainingQuota.toLocaleString()} words left).`}
          </span>
        </div>
      ) : text ? (
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            {language === 'my' ? 'လစဉ်ခွဲတမ်း အသုံးပြုမှု' : 'Monthly Quota Impact'}:
          </span>
          <span className="text-slate-300 font-mono">
            {analysis.words} / 100,000 ({quotaPercentOfCurrent.toFixed(2)}%)
          </span>
        </div>
      ) : null}

      {/* Primary Conversion Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!text.trim() || isLoading || isExceedingQuota}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition shadow-lg cursor-pointer ${
          !text.trim() || isExceedingQuota
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : isLoading
            ? 'bg-amber-600 text-slate-950 cursor-wait'
            : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 shadow-amber-500/25 active:scale-[0.99]'
        }`}
      >
        {isLoading ? (
          <>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-slate-950 rounded-full animate-wave-bar" />
              <span className="w-1.5 h-6 bg-slate-950 rounded-full animate-wave-bar [animation-delay:0.2s]" />
              <span className="w-1.5 h-3 bg-slate-950 rounded-full animate-wave-bar [animation-delay:0.4s]" />
            </div>
            <span>
              {language === 'my'
                ? 'မြန်မာအသံ ဖန်တီးနေပါသည်...'
                : 'Synthesizing Burmese Voice...'}
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 fill-slate-950" />
            <span>
              {language === 'my'
                ? 'မြန်မာ အသံဖန်တီးရန် (Generate Audio)'
                : 'Synthesize Natural Voice'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
