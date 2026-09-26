/**
 * Client-Side Offline Web Speech Engine
 * Allows speaking Burmese text without any internet connection.
 */

export interface OfflineSpeechOptions {
  rate?: number; // 0.25 to 3.0
  pitch?: number; // 0 to 2
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onBoundary?: (charIndex: number) => void;
}

export class WebSpeechEngine {
  private static instance: WebSpeechEngine;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded = false;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.voicesLoaded = true;
        };
      }
    }
  }

  public static getInstance(): WebSpeechEngine {
    if (!WebSpeechEngine.instance) {
      WebSpeechEngine.instance = new WebSpeechEngine();
    }
    return WebSpeechEngine.instance;
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public hasBurmeseVoice(): boolean {
    const voices = this.getVoices();
    return voices.some(
      (v) =>
        v.lang.toLowerCase().startsWith('my') ||
        v.name.toLowerCase().includes('burmese') ||
        v.name.toLowerCase().includes('myanmar')
    );
  }

  public speak(text: string, options: OfflineSpeechOptions = {}): void {
    if (!this.synth) {
      options.onError?.(new Error('SpeechSynthesis is not supported on this device.'));
      return;
    }

    // Safely stop previous utterance without triggering false error
    try {
      if (this.synth.speaking || this.synth.pending) {
        this.synth.cancel();
      }
    } catch {
      // ignore
    }

    // Small timeout to allow Chrome to reset cancelled state
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Reading speed & pitch
        utterance.rate = Math.max(0.5, Math.min(2.5, options.rate || 1.0));
        utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch || 1.0));

        const voices = this.getVoices();
        const burmeseVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith('my') ||
            v.name.toLowerCase().includes('burmese') ||
            v.name.toLowerCase().includes('myanmar')
        );

        if (burmeseVoice) {
          utterance.voice = burmeseVoice;
          utterance.lang = burmeseVoice.lang;
        } else {
          // If no Burmese voice exists in system TTS, do NOT force 'my-MM'
          // because Chromium rejects it with 'language-unavailable'.
          // Instead, use default voice or international voice
          const defaultVoice = voices.find((v) => v.default) || voices[0];
          if (defaultVoice) {
            utterance.voice = defaultVoice;
          }
        }

        utterance.onstart = () => {
          options.onStart?.();
        };

        utterance.onend = () => {
          this.currentUtterance = null;
          options.onEnd?.();
        };

        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
          // 'interrupted' or 'canceled' happens when user clicks another button or changes speed
          if (e.error === 'interrupted' || e.error === 'canceled') {
            return;
          }
          this.currentUtterance = null;
          console.warn('SpeechSynthesis event status:', e.error);
          options.onError?.(new Error(`Speech error: ${e.error || 'Speech synthesis failed'}`));
        };

        utterance.onboundary = (e) => {
          options.onBoundary?.(e.charIndex);
        };

        // Resume in case browser speech engine was suspended
        if (this.synth?.paused) {
          this.synth.resume();
        }

        this.synth?.speak(utterance);
      } catch (err) {
        options.onError?.(err);
      }
    }, 20);
  }

  public pause(): void {
    this.synth?.pause();
  }

  public resume(): void {
    this.synth?.resume();
  }

  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }
  }
}
