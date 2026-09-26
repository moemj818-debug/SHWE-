import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  language: 'my' | 'en';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/90 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur-md border border-amber-400">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        {language === 'my'
          ? 'အော့ဖ်လိုင်း စနစ် — စက်တွင်း အသံနှင့် စာကြည့်တိုက်ကို အသုံးပြုနေပါသည်'
          : 'Offline Mode — Local library and device speech active'}
      </span>
    </div>
  );
};
