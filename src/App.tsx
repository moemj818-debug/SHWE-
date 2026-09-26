import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  Sparkles,
  Zap,
  HardDrive,
  PieChart,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  Radio,
  Bot,
  Award,
  Gift,
  User,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { TextInputArea } from './components/TextInputArea';
import { VoiceSelector, BURMESE_VOICES, READING_STYLES } from './components/VoiceSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { QuotaModal, QuotaHistoryItem } from './components/QuotaModal';
import { OfflineLibraryModal } from './components/OfflineLibraryModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginPageModal } from './components/LoginPageModal';
import { ClaimActivitiesModal } from './components/ClaimActivitiesModal';
import { analyzeBurmese } from './lib/burmeseTokenizer';
import { generateBurmeseAcousticWav } from './lib/acousticSynthesizer';
import {
  saveOfflineTrack,
  getAllOfflineTracks,
  deleteOfflineTrack,
  clearAllOfflineTracks,
  OfflineAudioTrack,
} from './lib/indexedDb';
import { WebSpeechEngine } from './lib/webSpeechEngine';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { SAMPLE_BURMESE_TEXTS } from './lib/sampleTexts';
import {
  auth,
  db,
  syncUserProfile,
  recordCloudActivity,
  logoutUser,
  checkRedirectResult,
  UserProfile,
  CloudAudioActivity,
} from './lib/firebase';

const MONTHLY_QUOTA_LIMIT = 100000;
const STORAGE_QUOTA_KEY = 'shwevoice_quota_v1';
const STORAGE_HISTORY_KEY = 'shwevoice_history_v1';

export default function App() {
  const isOnline = useOnlineStatus();

  // Authentication & Cloud State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [cloudActivities, setCloudActivities] = useState<CloudAudioActivity[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // State
  const [burmeseText, setBurmeseText] = useState(SAMPLE_BURMESE_TEXTS[0].text);
  const [selectedVoice, setSelectedVoice] = useState('google-burmese-agent');
  const [selectedStyle, setSelectedStyle] = useState('conversational');
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [engineMode, setEngineMode] = useState<'google_agent' | 'gemini' | 'offline_device'>('google_agent');
  const [language, setLanguage] = useState<'my' | 'en'>('my');

  // Audio & playback state
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentVoiceName, setCurrentVoiceName] = useState('google-burmese-agent');
  const [isSavedCurrentOffline, setIsSavedCurrentOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals & Navigation
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isOfflineLibraryOpen, setIsOfflineLibraryOpen] = useState(false);

  // Quota & storage
  const [quotaUsed, setQuotaUsed] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_QUOTA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        if (parsed.month === currentMonth) {
          return parsed.usedWords || 0;
        }
      }
    } catch {
      // ignore
    }
    return 1240;
  });

  const [history, setHistory] = useState<QuotaHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  const [offlineTracks, setOfflineTracks] = useState<OfflineAudioTrack[]>([]);

  // Text analysis
  const analysis = useMemo(() => {
    return analyzeBurmese(burmeseText, readingSpeed);
  }, [burmeseText, readingSpeed]);

  const remainingQuota = Math.max(0, MONTHLY_QUOTA_LIMIT - quotaUsed);

  // Unclaimed activities count
  const unclaimedCount = useMemo(() => {
    return cloudActivities.filter((a) => !a.claimed).length;
  }, [cloudActivities]);

  // Auth state listener
  useEffect(() => {
    checkRedirectResult();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await syncUserProfile(firebaseUser);
          setCurrentUser(profile);
          if (profile.usedWords > 0) {
            setQuotaUsed(profile.usedWords);
          }
        } catch (err) {
          console.error('Failed to sync user profile:', err);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to user's audio activities in Firestore
  useEffect(() => {
    if (!currentUser?.id) {
      setCloudActivities([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'users', currentUser.id, 'activities'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const acts: CloudAudioActivity[] = [];
          snapshot.forEach((docSnap) => {
            acts.push(docSnap.data() as CloudAudioActivity);
          });
          setCloudActivities(acts);
        },
        (error) => {
          console.warn('Firestore activities listener notice:', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore query error:', e);
    }
  }, [currentUser?.id]);

  // Reload user profile after claiming
  const refreshUserProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const userRef = doc(db, 'users', currentUser.id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setCurrentUser(snap.data() as UserProfile);
      }
    } catch (err) {
      console.warn('Refresh user profile error', err);
    }
  };

  // Load offline tracks from IndexedDB
  useEffect(() => {
    getAllOfflineTracks().then((tracks) => {
      setOfflineTracks(tracks);
    });
  }, []);

  // Persist quota to localStorage
  useEffect(() => {
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    localStorage.setItem(
      STORAGE_QUOTA_KEY,
      JSON.stringify({ month: currentMonth, usedWords: quotaUsed })
    );
  }, [quotaUsed]);

  // Persist history
  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Check if current text is already saved in offline tracks
  useEffect(() => {
    if (!burmeseText.trim()) {
      setIsSavedCurrentOffline(false);
      return;
    }
    const exists = offlineTracks.some(
      (t) => t.text.trim() === burmeseText.trim() && t.voice === selectedVoice
    );
    setIsSavedCurrentOffline(exists);
  }, [burmeseText, selectedVoice, offlineTracks]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Generate Burmese Speech
  const handleGenerate = async () => {
    if (!burmeseText.trim()) return;
    setErrorMsg(null);

    const pitchMap: Record<string, number> = {
      Kore: 190,
      Zephyr: 210,
      Puck: 140,
      Fenrir: 110,
      Charon: 95,
      'google-burmese-agent': 180,
    };
    const voicePitch = pitchMap[selectedVoice] || 170;

    // If Offline Mode or Device Engine selected
    if (engineMode === 'offline_device' || !isOnline) {
      try {
        setIsLoading(true);
        const wavUrl = generateBurmeseAcousticWav(burmeseText, 22050, voicePitch, readingSpeed);
        setCurrentAudioUrl(wavUrl);
        setCurrentVoiceName(selectedVoice);

        const engine = WebSpeechEngine.getInstance();
        if (engine.isSupported() && engine.hasBurmeseVoice()) {
          engine.speak(burmeseText, { rate: readingSpeed });
        }

        // Record activity for claim data if signed in
        if (currentUser) {
          recordCloudActivity(currentUser.id, {
            title: burmeseText.slice(0, 36) + (burmeseText.length > 36 ? '...' : ''),
            text: burmeseText,
            wordCount: analysis.words,
            syllableCount: analysis.syllables,
            voice: selectedVoice,
            provider: 'offline_device',
            speed: readingSpeed,
            createdAt: Date.now(),
            audioUrl: wavUrl,
          }).catch(console.warn);
        }

        setToastMsg(
          language === 'my'
            ? 'စက်တွင်း အော့ဖ်လိုင်းအသံဖြင့် ဖန်တီးပြီးပါပြီ (ခွဲတမ်းမကုန်ပါ)'
            : 'Generated offline audio (0 monthly words quota consumed).'
        );
      } catch (err: any) {
        console.error('Offline audio generation error:', err);
        setErrorMsg(err.message || 'Offline speech generation failed.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Online synthesis (Google Burmese Agents or Gemini)
    try {
      setIsLoading(true);
      const styleObj = READING_STYLES.find((s) => s.id === selectedStyle);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: burmeseText,
          voice: selectedVoice,
          speed: readingSpeed,
          style: styleObj ? styleObj.prompt : undefined,
          provider: engineMode === 'google_agent' || selectedVoice.startsWith('google-') ? 'google_agent' : 'gemini',
          userId: currentUser?.id || 'default',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.audioUrl) {
        throw new Error(data.error || 'Failed to synthesize Burmese audio.');
      }

      setCurrentAudioUrl(data.audioUrl);
      setCurrentVoiceName(data.voice || selectedVoice);

      // Deduct words quota
      const wordsCounted = data.wordCount || analysis.words;
      setQuotaUsed((prev) => prev + wordsCounted);

      // Add to conversion history
      const historyItem: QuotaHistoryItem = {
        id: `conv_${Date.now()}`,
        title: burmeseText.slice(0, 36) + (burmeseText.length > 36 ? '...' : ''),
        wordCount: wordsCounted,
        voice: data.voice || selectedVoice,
        speed: readingSpeed,
        timestamp: Date.now(),
        audioUrl: data.audioUrl,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);

      // Record in Firestore for Claim Data if user is logged in
      if (currentUser?.id) {
        recordCloudActivity(currentUser.id, {
          title: burmeseText.slice(0, 36) + (burmeseText.length > 36 ? '...' : ''),
          text: burmeseText,
          wordCount: wordsCounted,
          syllableCount: data.syllableCount || analysis.syllables,
          voice: data.voice || selectedVoice,
          provider: data.provider || (selectedVoice.startsWith('google-') ? 'google_agent' : 'gemini'),
          speed: readingSpeed,
          createdAt: Date.now(),
          audioUrl: data.audioUrl,
        }).catch(console.warn);
      }

      if (data.isGoogleAgent || selectedVoice.startsWith('google-')) {
        setToastMsg(
          language === 'my'
            ? 'မြန်မာ Google အေဂျင်စီ အသံဖြင့် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ! (Claim Data တွင် မှတ်တမ်းတင်ထားပါသည်)'
            : 'Synthesized with Burmese Google Agent! Recorded for Claim Data.'
        );
      } else if (data.isFallback) {
        setToastMsg(
          language === 'my'
            ? 'သဘာဝ အသံထွက်စနစ်ဖြင့် အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ'
            : 'Synthesized with ShweVoice acoustic engine. Audio ready!'
        );
      } else {
        setToastMsg(
          language === 'my'
            ? `အသံဖန်တီးမှု အောင်မြင်ပါသည် (${wordsCounted} လုံး ခွဲတမ်းထဲမှ အသုံးပြုခဲ့သည်)`
            : `Synthesized successfully! (${wordsCounted} words used)`
        );
      }
    } catch (err: any) {
      console.warn('Online synthesis error, using fallback acoustic synthesizer:', err);
      try {
        const fallbackWav = generateBurmeseAcousticWav(burmeseText, 22050, voicePitch, readingSpeed);
        setCurrentAudioUrl(fallbackWav);
        setCurrentVoiceName(selectedVoice);
        setToastMsg(
          language === 'my'
            ? 'အရန်အသံစနစ်ဖြင့် အသံဖန်တီးပေးထားပါသည်'
            : 'Generated with ShweVoice acoustic engine!'
        );
      } catch (fallbackErr) {
        setErrorMsg('Voice synthesis failed. Please try switching to offline mode.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save current audio to Offline Library (IndexedDB)
  const handleSaveOffline = async () => {
    if (!currentAudioUrl || !burmeseText) return;

    try {
      const track: OfflineAudioTrack = {
        id: `track_${Date.now()}`,
        title: burmeseText.slice(0, 30) + (burmeseText.length > 30 ? '...' : ''),
        text: burmeseText,
        audioData: currentAudioUrl,
        wordCount: analysis.words,
        syllableCount: analysis.syllables,
        voice: currentVoiceName,
        speed: readingSpeed,
        savedAt: Date.now(),
      };

      await saveOfflineTrack(track);
      setOfflineTracks((prev) => [track, ...prev]);
      setIsSavedCurrentOffline(true);
      setToastMsg(
        language === 'my'
          ? 'အော့ဖ်လိုင်း စာကြည့်တိုက်တွင် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!'
          : 'Successfully saved to Offline Library!'
      );
    } catch (err) {
      console.error('Failed to save offline track', err);
      setToastMsg('Failed to save offline track.');
    }
  };

  // Play saved track from offline library
  const handlePlaySavedTrack = (track: OfflineAudioTrack) => {
    setBurmeseText(track.text);
    setCurrentAudioUrl(track.audioData);
    setCurrentVoiceName(track.voice);
    setReadingSpeed(track.speed || 1.0);
    setIsSavedCurrentOffline(true);
    setToastMsg(
      language === 'my'
        ? `အော့ဖ်လိုင်းအသံ ဖွင့်ပါပြီ: ${track.title}`
        : `Playing offline track: ${track.title}`
    );
  };

  // Play track from Cloud Activities
  const handlePlayCloudActivity = (act: CloudAudioActivity) => {
    setBurmeseText(act.text);
    if (act.audioUrl) {
      setCurrentAudioUrl(act.audioUrl);
    }
    setCurrentVoiceName(act.voice);
    setReadingSpeed(act.speed || 1.0);
    setToastMsg(
      language === 'my'
        ? `အသံမှတ်တမ်း ဖွင့်ပါပြီ: ${act.title}`
        : `Playing audio activity: ${act.title}`
    );
  };

  // Delete saved track
  const handleDeleteTrack = async (id: string) => {
    await deleteOfflineTrack(id);
    setOfflineTracks((prev) => prev.filter((t) => t.id !== id));
    setToastMsg(language === 'my' ? 'ဖျက်ပြီးပါပြီ' : 'Deleted from offline library');
  };

  // Clear all saved tracks
  const handleClearAllTracks = async () => {
    await clearAllOfflineTracks();
    setOfflineTracks([]);
    setToastMsg(language === 'my' ? 'အော့ဖ်လိုင်းဖိုင်များ အားလုံး ဖျက်ပြီးပါပြီ' : 'All offline tracks cleared');
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCloudActivities([]);
    setToastMsg(language === 'my' ? 'Google အကောင့်မှ ထွက်ပြီးပါပြီ' : 'Signed out of Google account');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navbar */}
      <Navbar
        quotaUsed={quotaUsed}
        quotaLimit={MONTHLY_QUOTA_LIMIT}
        onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
        onOpenOfflineLibrary={() => setIsOfflineLibraryOpen(true)}
        offlineCount={offlineTracks.length}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'my' ? 'en' : 'my'))}
        user={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenClaimModal={() => {
          if (!currentUser) {
            setIsLoginModalOpen(true);
          } else {
            setIsClaimModalOpen(true);
          }
        }}
        unclaimedCount={unclaimedCount}
        claimPoints={currentUser?.claimPoints || 0}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* User Account / Claim Quick Bar */}
        {currentUser ? (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30 border border-emerald-500/30 p-3.5 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  className="w-9 h-9 rounded-xl object-cover border-2 border-emerald-400"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center">
                  {currentUser.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Google Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'my'
                    ? `လက်ကျန် Claim ဆုလာဘ်များ: ${currentUser.claimPoints || 0} pts • ${cloudActivities.length} Audio Activities`
                    : `Claim Points: ${currentUser.claimPoints || 0} pts • ${cloudActivities.length} Audio Activities`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  {language === 'my'
                    ? `Claim Data ရယူရန် (${unclaimedCount})`
                    : `Claim Audio Data (${unclaimedCount})`}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-to-r from-blue-950/20 via-slate-900 to-amber-950/20 border border-slate-800/80 p-3.5 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {language === 'my'
                    ? 'Google အကောင့်ဖြင့် ဝင်ရောက်ပြီး အသံတိုင်းအတွက် Claim Data ရယူပါ'
                    : 'Sign in with Google to claim data & rewards for every audio activity'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {language === 'my'
                    ? 'အခမဲ့ စကားလုံး ၁၀၀,၀၀၀ နှင့် လှုပ်ရှားမှုများကို cloud ပေါ်တွင် ထိန်းသိမ်းထားနိုင်ပါသည်'
                    : 'Keep your 100,000 monthly quota and audio activity records safely synced.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow cursor-pointer shrink-0"
            >
              {/* Google G Icon */}
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
              <span>{language === 'my' ? 'Google ဖြင့် ဝင်ရန်' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}

        {/* Hero Banner with Feature Badges */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {language === 'my'
                  ? 'လစဉ် စကားလုံး ၁၀၀,၀၀၀ အခမဲ့ • Google အေဂျင်စီများ • Claim Data ရယူရန်'
                  : '100,000 Free Words / Month • Burmese Google Agents • Claim Data'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {language === 'my' ? (
                <>
                  မြန်မာစာသားမှ <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">သဘာဝကျသော အသံ</span> ဖန်တီးစနစ်
                </>
              ) : (
                <>
                  Burmese Text to <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">Natural Audio</span> Reader
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
              {language === 'my'
                ? 'မြန်မာဘာသာစကား သံနေသံထား တိကျစွာဖြင့် သဘာဝကျကျ အသံပြောင်းလဲပေးပါသည်။ Google Burmese Agents နှင့် Gemini အသံရှင်များဖြင့် ဖတ်ကြားနိုင်ပြီး အသံတိုင်းအတွက် Claim Data ရယူနိုင်ပါသည်။'
                : 'High-fidelity natural Burmese voice synthesis with Google Agents, adjustable speeds (0.25x - 3.0x), 100,000 free monthly words, and cloud activity claims.'}
            </p>

            {/* Feature Pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                {language === 'my' ? 'Google အေဂျင်စီများ (my-MM)' : 'Burmese Google Agents'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                {language === 'my' ? 'Claim Data စနစ်' : 'Activity Claim Rewards'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {language === 'my' ? 'Gemini 3.8 AI စနစ်' : 'Gemini 3.8 AI Studio'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                {language === 'my' ? 'ဖတ်နှုန်း 0.25x မှ 3.0x' : '0.25x - 3.0x Speed'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                {language === 'my' ? 'အော့ဖ်လိုင်း စာကြည့်တိုက်' : 'Offline Vault'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <PieChart className="w-3.5 h-3.5 text-amber-400" />
                {language === 'my' ? '၁၀၀,၀၀၀ လုံး အခမဲ့' : '100,000 Free Words'}
              </span>
            </div>
          </div>
        </section>

        {/* Global Error Notice */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{language === 'my' ? 'အမှားဖြစ်ပေါ်ပါသည်' : 'Error'}</span>
                <p className="text-xs text-rose-200/90 mt-0.5">{errorMsg}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEngineMode('offline_device');
                      setErrorMsg(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    {language === 'my' ? 'စက်တွင်း အော့ဖ်လိုင်းအသံဖြင့် စမ်းသပ်ရန်' : 'Switch to Offline Device Speech'}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Text Input & Voice Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <TextInputArea
              text={burmeseText}
              onChangeText={setBurmeseText}
              analysis={analysis}
              speed={readingSpeed}
              remainingQuota={remainingQuota}
              isLoading={isLoading}
              onGenerate={handleGenerate}
              language={language}
            />

            <VoiceSelector
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              selectedStyle={selectedStyle}
              onSelectStyle={setSelectedStyle}
              engineMode={engineMode}
              onChangeEngineMode={setEngineMode}
              isOnline={isOnline}
              language={language}
            />
          </div>

          {/* Right Column: Audio Player & Offline Library Quickview (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            {/* Audio Player Card */}
            <AudioPlayer
              audioUrl={currentAudioUrl}
              text={burmeseText}
              voice={currentVoiceName}
              speed={readingSpeed}
              onSpeedChange={setReadingSpeed}
              onSaveOffline={handleSaveOffline}
              isSavedOffline={isSavedCurrentOffline}
              language={language}
              sentences={analysis.sentences}
            />

            {/* Quick Claim Data Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {language === 'my' ? 'Audio Activity & Claim Data' : 'Activity & Claim Data'}
                  </h4>
                </div>
                <button
                  onClick={() => {
                    if (!currentUser) setIsLoginModalOpen(true);
                    else setIsClaimModalOpen(true);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {language === 'my' ? 'အားလုံးကြည့်ရန်' : 'View All'} ({cloudActivities.length})
                </button>
              </div>

              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {language === 'my' ? 'ရယူနိုင်သော မှတ်များ:' : 'Unclaimed Activities:'}
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {unclaimedCount} items
                    </span>
                  </div>

                  <button
                    onClick={() => setIsClaimModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{language === 'my' ? 'Claim Data ဖွင့်ရန်' : 'Open Claim Activity Board'}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 space-y-2">
                  <p className="text-xs text-slate-400">
                    {language === 'my'
                      ? 'ဖန်တီးထားသော အသံတိုင်းအတွက် မှတ်တမ်းနှင့် အချက်အလက်များကို Claim ပြုလုပ်နိုင်ရန် Google ဖြင့် ဝင်ရောက်ပါ'
                      : 'Sign in to save and claim data for every audio activity you synthesize.'}
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{language === 'my' ? 'Google ဖြင့် ဝင်ရောက်ရန်' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Offline Library Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {language === 'my' ? 'အော့ဖ်လိုင်း စာကြည့်တိုက် အမြန်ဖွင့်ရန်' : 'Offline Audio Library'}
                  </h4>
                </div>
                <button
                  onClick={() => setIsOfflineLibraryOpen(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  {language === 'my' ? 'အားလုံးကြည့်ရန်' : 'View All'} ({offlineTracks.length})
                </button>
              </div>

              {offlineTracks.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  {language === 'my'
                    ? 'အသံဖန်တီးပြီးပါက "အော့ဖ်လိုင်းသိမ်းမည်" ကို နှိပ်ပြီး ဤနေရာတွင် သိမ်းဆည်းနိုင်ပါသည်'
                    : 'Saved tracks appear here for instant offline playback anytime.'}
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {offlineTracks.slice(0, 3).map((track) => (
                    <div
                      key={track.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2.5 hover:border-slate-700 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <h6 className="text-xs font-semibold text-slate-200 truncate burmese-font">
                          {track.text}
                        </h6>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {track.voice} • {track.speed}x • {track.wordCount} words
                        </span>
                      </div>
                      <button
                        onClick={() => handlePlaySavedTrack(track)}
                        className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition"
                        title="Play offline track"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 100,000 Free Words Card */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {language === 'my' ? 'လစဉ် စကားလုံး ခွဲတမ်း' : 'Monthly Allowance'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {remainingQuota.toLocaleString()} left
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                  style={{ width: `${Math.min(100, (quotaUsed / MONTHLY_QUOTA_LIMIT) * 100)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {language === 'my'
                  ? 'လစဉ် စကားလုံး ၁၀၀,၀၀၀ အထိ အခမဲ့ သုံးစွဲနိုင်ပါသည်။ အော့ဖ်လိုင်းနားထောင်ခြင်းများသည် ခွဲတမ်းမကုန်ပါ။'
                  : 'You get 100,000 words free every month. Offline mode and saved audio playback consume 0 words.'}
              </p>

              <button
                onClick={() => setIsQuotaModalOpen(true)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                {language === 'my' ? 'ခွဲတမ်းနှင့် မှတ်တမ်း အသေးစိတ်ကြည့်ရန်' : 'View Quota History & Analytics'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Offline Indicator */}
      <OfflineIndicator language={language} />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 border border-amber-500/40 text-slate-100 px-4 py-3 text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modals */}
      <LoginPageModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setToastMsg(
            language === 'my'
              ? 'Google အကောင့်ဖြင့် အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ!'
              : 'Successfully signed in with Google!'
          );
        }}
        language={language}
      />

      <ClaimActivitiesModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        activities={cloudActivities}
        userId={currentUser?.id || null}
        onPlayActivity={handlePlayCloudActivity}
        onActivityClaimed={() => {
          refreshUserProfile();
          setToastMsg(
            language === 'my'
              ? 'Claim ရယူမှု အောင်မြင်ပါသည်! ဆုလာဘ်မှတ်များ ပေါင်းထည့်ပြီးပါပြီ'
              : 'Activity successfully claimed! Reward points added.'
          );
        }}
        claimPoints={currentUser?.claimPoints || 0}
        language={language}
      />

      <QuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        quotaUsed={quotaUsed}
        quotaLimit={MONTHLY_QUOTA_LIMIT}
        history={history}
        onPlayHistoryItem={(item) => {
          if (item.audioUrl) {
            setCurrentAudioUrl(item.audioUrl);
            setCurrentVoiceName(item.voice);
            setReadingSpeed(item.speed || 1.0);
          }
        }}
        language={language}
      />

      <OfflineLibraryModal
        isOpen={isOfflineLibraryOpen}
        onClose={() => setIsOfflineLibraryOpen(false)}
        tracks={offlineTracks}
        onPlayTrack={handlePlaySavedTrack}
        onDeleteTrack={handleDeleteTrack}
        onClearAll={handleClearAllTracks}
        language={language}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <p className="burmese-font">
          {language === 'my'
            ? 'ShweVoice — မြန်မာစာသားမှ အသံပြောင်းလဲပေးသော အဆင့်မြင့်စနစ် • Google Login & Claim Data • လစဉ် စကားလုံး ၁၀၀,၀၀၀ အခမဲ့'
            : 'ShweVoice — Natural Burmese Text-to-Audio Synthesis • Google Account & Claim Data • 100,000 Free Monthly Words'}
        </p>
      </footer>
    </div>
  );
}
