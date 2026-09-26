import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Play,
  Trash2,
  Download,
  Search,
  Volume2,
  Clock,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { OfflineAudioTrack } from '../lib/indexedDb';
import { formatSecondsToTime } from '../lib/burmeseTokenizer';

interface OfflineLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: OfflineAudioTrack[];
  onPlayTrack: (track: OfflineAudioTrack) => void;
  onDeleteTrack: (id: string) => void;
  onClearAll: () => void;
  language: 'my' | 'en';
}

export const OfflineLibraryModal: React.FC<OfflineLibraryModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onPlayTrack,
  onDeleteTrack,
  onClearAll,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.text.toLowerCase().includes(q) ||
      t.voice.toLowerCase().includes(q)
    );
  });

  const handleDownload = (track: OfflineAudioTrack) => {
    const a = document.createElement('a');
    a.href = track.audioData;
    const cleanTitle = track.title.replace(/[^\w\u1000-\u109F]/g, '_') || 'burmese_track';
    a.download = `shwevoice_${cleanTitle}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>
                  {language === 'my'
                    ? 'အော့ဖ်လိုင်း စာကြည့်တိုက် (Offline Audio Library)'
                    : 'Offline Audio Library'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {tracks.length} tracks
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'my'
                  ? 'အင်တာနက်မရှိဘဲ အချိန်မရွေး ပြန်လည်နားဆင်နိုင်သော အသံဖိုင်များ'
                  : 'Saved tracks in IndexedDB — play anywhere without internet'}
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

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'my'
                  ? 'အသံဖိုင် သို့မဟုတ် စာသားကို ရှာဖွေပါ...'
                  : 'Search saved tracks or text...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {tracks.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(language === 'my' ? 'သိမ်းဆည်းထားသော အသံဖိုင်အားလုံးကို ဖျက်လိုပါသလား။' : 'Clear all offline tracks?')) {
                  onClearAll();
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-xs text-rose-400 font-medium transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'my' ? 'အားလုံးဖျက်ရန်' : 'Clear All'}</span>
            </button>
          )}
        </div>

        {/* Tracks List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredTracks.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
                <WifiOff className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300">
                {language === 'my'
                  ? 'အော့ဖ်လိုင်း အသံဖိုင် မရှိသေးပါ'
                  : 'No Offline Audio Tracks Yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {language === 'my'
                  ? 'မြန်မာစာသားကို အသံပြောင်းပြီးနောက် "အော့ဖ်လိုင်းသိမ်းမည်" ခလုတ်ကို နှိပ်ပါ'
                  : 'Synthesize any Burmese text, then click "Save Offline" on the audio player to listen anytime without internet.'}
              </p>
            </div>
          ) : (
            filteredTracks.map((track) => (
              <div
                key={track.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono">
                      {track.voice}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {track.speed}x speed
                    </span>
                    <span className="text-[11px] text-slate-500">
                      • {new Date(track.savedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h5 className="text-sm font-medium text-slate-100 mt-1.5 line-clamp-2 burmese-font leading-snug">
                    {track.text}
                  </h5>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                    <span>{track.wordCount} words</span>
                    <span>•</span>
                    <span>{track.syllableCount} syllables</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onPlayTrack(track);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{language === 'my' ? 'ဖွင့်ရန်' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(track)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Download .wav file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTrack(track.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition"
                    title="Delete track"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {language === 'my'
              ? 'အော့ဖ်လိုင်း စာကြည့်တိုက်သည် သင့်စက်တွင်း၌သာ လုံခြုံစွာ သိမ်းဆည်းပါသည်'
              : 'Stored safely in your device’s local browser storage'}
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
