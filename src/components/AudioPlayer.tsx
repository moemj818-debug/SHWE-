import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  BookmarkPlus,
  BookmarkCheck,
  FastForward,
  Rewind,
  Gauge,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { formatSecondsToTime } from '../lib/burmeseTokenizer';

interface AudioPlayerProps {
  audioUrl: string | null;
  text: string;
  voice: string;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onSaveOffline: () => void;
  isSavedOffline: boolean;
  language: 'my' | 'en';
  sentences: string[];
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  text,
  voice,
  speed,
  onSpeedChange,
  onSaveOffline,
  isSavedOffline,
  language,
  sentences,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(0);
  const [showPitchSlider, setShowPitchSlider] = useState(false);
  const [customPitch, setCustomPitch] = useState(1); // 0.8 to 1.2

  const speedPresets = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  // Set audio source & reset state
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (sentences.length > 0 && audio.duration > 0) {
        const progress = audio.currentTime / audio.duration;
        const index = Math.min(sentences.length - 1, Math.floor(progress * sentences.length));
        setActiveSentenceIndex(index);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setActiveSentenceIndex(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, sentences]);

  // Update speed & pitch preservation
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      // @ts-ignore
      audioRef.current.preservesPitch = true;
    }
  }, [speed]);

  // Waveform canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let wavePhase = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const barWidth = 4;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        // Playback progress indicator
        const progress = duration > 0 ? currentTime / duration : 0;
        const isPassed = i / barCount <= progress;

        let barHeight = 8;
        if (isPlaying) {
          // Dynamic wave pattern
          const sinFactor = Math.sin(wavePhase + i * 0.25);
          const cosFactor = Math.cos(wavePhase * 0.7 + i * 0.15);
          barHeight = 10 + Math.abs(sinFactor * 22 + cosFactor * 16);
        } else {
          // Static harmonic wave preview
          const wave = Math.sin((i / barCount) * Math.PI * 3);
          barHeight = 8 + Math.abs(wave) * 16;
        }

        const y = (height - barHeight) / 2;

        if (isPassed) {
          // Golden gradient for elapsed
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#fcd34d');
          grad.addColorStop(1, '#f59e0b');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#334155';
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        wavePhase += 0.08 * speed;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, speed]);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback interrupted:', e);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.volume = volume || 0.8;
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const cleanTitle = text.slice(0, 16).replace(/[^\w\u1000-\u109F]/g, '_') || 'burmese_audio';
    a.download = `shwevoice_${cleanTitle}_${speed}x.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!audioUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
          <Play className="w-6 h-6 ml-0.5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-300">
          {language === 'my' ? 'အသံဖွင့်စက် အသင့်ဖြစ်နေပါသည်' : 'Audio Player Ready'}
        </h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          {language === 'my'
            ? 'မြန်မာစာသားကို ရိုက်ထည့်ပြီး "အသံဖန်တီးရန်" ခလုတ်ကို နှိပ်ပါ'
            : 'Enter Burmese text and click "Generate Audio" to synthesize natural voice.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-md transition-all">
      <audio ref={audioRef} src={audioUrl} loop={isLooping} preload="metadata" />

      {/* Top Header Bar */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg border ${
            voice.startsWith('google-')
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200">
                {language === 'my' ? 'သဘာဝကျသော မြန်မာအသံ' : 'Burmese Natural Speech'}
              </span>
              {voice.startsWith('google-') && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Google Agent
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              Voice: <strong className={voice.startsWith('google-') ? 'text-blue-300' : 'text-amber-300'}>{voice}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save to Offline Library */}
          <button
            onClick={onSaveOffline}
            disabled={isSavedOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isSavedOffline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/40'
            }`}
            title="Save for offline listening without internet"
          >
            {isSavedOffline ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">
                  {language === 'my' ? 'သိမ်းဆည်းပြီး' : 'Saved Offline'}
                </span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {language === 'my' ? 'အော့ဖ်လိုင်းသိမ်းမည်' : 'Save Offline'}
                </span>
              </>
            )}
          </button>

          {/* Download WAV */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium hover:border-amber-500/40 transition"
            title="Download high-quality .WAV audio"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform & Scrubber Area */}
      <div className="p-5 space-y-4">
        {/* Waveform Canvas */}
        <div className="relative w-full h-14 bg-slate-950/70 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center px-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Seekbar & Time */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatSecondsToTime(currentTime)}</span>
            <span>{formatSecondsToTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Main Transport (Skip -10, Play/Pause, Skip +10, Loop) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Skip back 10 seconds"
            >
              <Rewind className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/25 transition cursor-pointer transform active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-slate-950" />
              ) : (
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleSkip(10)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Skip forward 10 seconds"
            >
              <FastForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* Adjustable Reading Speed Controls (Direct Requirement) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'my' ? 'ဖတ်ကြားနှုန်း ချိန်ညှိရန်' : 'Adjustable Reading Speed'}</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              {speed}x
            </span>
          </div>

          {/* Speed Presets Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {speedPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => onSpeedChange(preset)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                  speed === preset
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                {preset}x
                {preset === 1.0 && (
                  <span className="text-[10px] ml-1 opacity-70">
                    {language === 'my' ? '(ပုံမှန်)' : '(Normal)'}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Smooth Speed Slider */}
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[11px] text-slate-400 font-mono">0.25x</span>
            <input
              type="range"
              min={0.25}
              max={3.0}
              step={0.05}
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[11px] text-slate-400 font-mono">3.0x</span>
          </div>
        </div>

        {/* Karaoke-Style Burmese Sentence Reader */}
        {sentences.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <span>{language === 'my' ? 'လက်ရှိဖတ်ကြားနေသော ဝါကျ' : 'Active Reading Tracking'}</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-sm leading-relaxed burmese-font max-h-32 overflow-y-auto">
              {sentences.map((sent, idx) => (
                <span
                  key={idx}
                  className={`inline-block mr-1.5 px-1 py-0.5 rounded transition-colors ${
                    idx === activeSentenceIndex
                      ? 'bg-amber-400/20 text-amber-200 font-semibold border-b-2 border-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {sent}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
