import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with required User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Burmese word and syllable counting logic
 */
function analyzeBurmeseText(text: string) {
  if (!text || !text.trim()) {
    return { words: 0, syllables: 0, characters: 0, estimatedSeconds: 0 };
  }

  // Count non-whitespace characters
  const characters = text.replace(/\s+/g, '').length;

  // Burmese syllable pattern: consonant or independent vowel followed by medials, vowels, virama/asat
  const burmeseSyllableRegex = /(?:[\u1000-\u1021\u1023-\u102A\u104E](?:[\u103B-\u103E])*(?:[\u102B-\u1035\u1037\u1038])*(?:[\u1036])*(?:[\u103A]|(?:\u1039[\u1000-\u1021]))*)/g;
  const burmeseSyllables = text.match(burmeseSyllableRegex) || [];
  const syllableCount = burmeseSyllables.length;

  // Match English / numeric words
  const latinWords = text.match(/[a-zA-Z0-9_-]+/g) || [];
  const latinWordCount = latinWords.length;

  // Burmese words generally average ~1.65 syllables per word
  const estimatedBurmeseWords = Math.ceil(syllableCount / 1.65);
  const totalWords = estimatedBurmeseWords + latinWordCount;

  // Average reading speed for Burmese is ~140-160 words per minute (approx 2.5 words/sec)
  const estimatedSeconds = Math.max(1, Math.round((totalWords / 150) * 60));

  return {
    words: totalWords,
    syllables: syllableCount,
    characters,
    estimatedSeconds,
  };
}

/**
 * Convert raw PCM 16-bit to standard WAV format
 */
function pcm16ToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, channels = 1): Buffer {
  if (pcmBuffer.length >= 4 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }

  const header = Buffer.alloc(44);
  const totalDataLen = pcmBuffer.length;
  const totalFileLen = totalDataLen + 36;
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;

  // RIFF chunk
  header.write('RIFF', 0);
  header.writeUInt32LE(totalFileLen, 4);
  header.write('WAVE', 8);

  // 'fmt ' chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // 16-bit

  // 'data' chunk
  header.write('data', 36);
  header.writeUInt32LE(totalDataLen, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-memory audio cache to prevent rate-limit exhaustion and reduce latency
const audioCache = new Map<string, string>();

/**
 * Fetch official Google Burmese Agent audio
 */
async function fetchGoogleBurmeseAgentAudio(text: string): Promise<Buffer> {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (remaining.length <= 160) {
      chunks.push(remaining);
      break;
    }
    let splitIdx = -1;
    const window = remaining.slice(0, 160);
    const lastSectionEnd = window.lastIndexOf('။');
    const lastComma = window.lastIndexOf('၊');
    const lastSpace = window.lastIndexOf(' ');

    if (lastSectionEnd > 40) splitIdx = lastSectionEnd + 1;
    else if (lastComma > 40) splitIdx = lastComma + 1;
    else if (lastSpace > 40) splitIdx = lastSpace + 1;
    else splitIdx = 160;

    chunks.push(remaining.slice(0, splitIdx).trim());
    remaining = remaining.slice(splitIdx).trim();
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=my&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Google TTS request returned status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    buffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(buffers);
}

/**
 * Generate fallback acoustic speech WAV buffer
 */
function generateAcousticWavBuffer(text: string, voice = 'Kore', speed = 1.0, sampleRate = 22050): Buffer {
  const pitchMap: Record<string, number> = {
    Kore: 190,
    Zephyr: 210,
    Puck: 140,
    Fenrir: 110,
    Charon: 95,
  };
  const voicePitch = pitchMap[voice] || 170;

  const syllableRegex = /(?:[\u1000-\u1021\u1023-\u102A\u104E](?:[\u103B-\u103E])*(?:[\u102B-\u1035\u1037\u1038])*(?:[\u1036])*(?:[\u103A]|(?:\u1039[\u1000-\u1021]))*)/g;
  const syllables = text.match(syllableRegex) || [];

  if (syllables.length === 0) {
    const totalSamples = Math.floor(sampleRate * 0.5);
    const pcm = Buffer.alloc(totalSamples * 2);
    return pcm16ToWavBuffer(pcm, sampleRate, 1);
  }

  const syllableDuration = Math.max(0.12, Math.min(0.35, 0.22 / speed));
  const samplesPerSyllable = Math.floor(sampleRate * syllableDuration);
  const pauseSamples = Math.floor(sampleRate * (0.04 / speed));
  const totalSamples = syllables.length * (samplesPerSyllable + pauseSamples);

  const pcm = Buffer.alloc(totalSamples * 2);
  let sampleOffset = 0;

  for (let sIdx = 0; sIdx < syllables.length; sIdx++) {
    const syl = syllables[sIdx];
    const isSentenceEnd = syl.includes('။') || syl.includes('၊');

    let toneType = 'low';
    if (syl.includes('\u1038')) toneType = 'high';
    else if (syl.includes('\u1037')) toneType = 'creaky';
    else if (syl.includes('\u103A')) toneType = 'checked';

    let f1 = 650;
    let f2 = 1300;
    if (syl.includes('\u102D') || syl.includes('\u102E')) { f1 = 300; f2 = 2200; }
    else if (syl.includes('\u102F') || syl.includes('\u1030')) { f1 = 320; f2 = 800; }
    else if (syl.includes('\u1031')) { f1 = 500; f2 = 1800; }
    else if (syl.includes('\u102C') || syl.includes('\u102B')) { f1 = 750; f2 = 1250; }

    let f0Start = voicePitch;
    let f0End = voicePitch;
    if (toneType === 'high') { f0Start = voicePitch * 1.05; f0End = voicePitch * 1.25; }
    else if (toneType === 'creaky') { f0Start = voicePitch * 1.15; f0End = voicePitch * 0.95; }
    else if (toneType === 'checked') { f0Start = voicePitch * 1.1; f0End = voicePitch * 1.15; }
    else { f0Start = voicePitch * 0.95; f0End = voicePitch * 0.98; }

    let phase = 0;
    const sylLen = toneType === 'checked' ? Math.floor(samplesPerSyllable * 0.7) : samplesPerSyllable;

    for (let i = 0; i < sylLen; i++) {
      const t = i / sylLen;
      let env = 1;
      if (t < 0.15) env = t / 0.15;
      else if (t > 0.8) env = (1 - t) / 0.2;

      const currentF0 = f0Start + (f0End - f0Start) * t;
      phase += (2 * Math.PI * currentF0) / sampleRate;

      const glottal = Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase);
      const f1Val = Math.sin((2 * Math.PI * f1 * i) / sampleRate) * 0.35;
      const f2Val = Math.sin((2 * Math.PI * f2 * i) / sampleRate) * 0.25;

      const sample = (glottal * 0.5 + f1Val + f2Val) * env * 14000;
      const clamped = Math.max(-32767, Math.min(32767, Math.floor(sample)));
      pcm.writeInt16LE(clamped, sampleOffset);
      sampleOffset += 2;
    }

    const extraPause = isSentenceEnd ? pauseSamples * 3 : pauseSamples;
    for (let p = 0; p < extraPause; p++) {
      if (sampleOffset < pcm.length) {
        pcm.writeInt16LE(0, sampleOffset);
        sampleOffset += 2;
      }
    }
  }

  return pcm16ToWavBuffer(pcm.subarray(0, sampleOffset), sampleRate, 1);
}

// In-memory monthly quota tracker per session/IP
const quotaStore: Record<string, { month: string; usedWords: number }> = {};
const MONTHLY_LIMIT = 100000;

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getQuotaForUser(userId = 'default'): { month: string; usedWords: number; limit: number; remainingWords: number } {
  const currentMonth = getCurrentMonthKey();
  if (!quotaStore[userId] || quotaStore[userId].month !== currentMonth) {
    quotaStore[userId] = {
      month: currentMonth,
      usedWords: 0,
    };
  }
  const used = quotaStore[userId].usedWords;
  return {
    month: currentMonth,
    usedWords: used,
    limit: MONTHLY_LIMIT,
    remainingWords: Math.max(0, MONTHLY_LIMIT - used),
  };
}

// API Routes
app.get('/api/quota', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'default';
  const quota = getQuotaForUser(userId);
  res.json(quota);
});

app.post('/api/analyze', (req: Request, res: Response) => {
  const { text } = req.body;
  const analysis = analyzeBurmeseText(text || '');
  res.json(analysis);
});

app.post('/api/google-tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'google-burmese-agent', speed = 1.0, userId = 'default' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Burmese text is required.' });
    }
    const trimmedText = text.trim();
    const stats = analyzeBurmeseText(trimmedText);

    const cacheKey = `google_${voice}_${trimmedText}`;
    if (audioCache.has(cacheKey)) {
      return res.json({
        success: true,
        audioUrl: audioCache.get(cacheKey)!,
        wordCount: stats.words,
        syllableCount: stats.syllables,
        characterCount: stats.characters,
        estimatedSeconds: stats.estimatedSeconds,
        voice,
        provider: 'google_agent',
        speed,
        fromCache: true,
      });
    }

    const mp3Buffer = await fetchGoogleBurmeseAgentAudio(trimmedText);
    const mp3Base64 = mp3Buffer.toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${mp3Base64}`;

    audioCache.set(cacheKey, audioDataUrl);

    // Update quota
    const quota = getQuotaForUser(userId);
    quotaStore[userId].usedWords += stats.words;

    res.json({
      success: true,
      audioUrl: audioDataUrl,
      wordCount: stats.words,
      syllableCount: stats.syllables,
      characterCount: stats.characters,
      estimatedSeconds: stats.estimatedSeconds,
      voice,
      provider: 'google_agent',
      speed,
      quota: getQuotaForUser(userId),
    });
  } catch (err: any) {
    console.error('Error fetching Google Agent audio:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch Google Agent audio.' });
  }
});

app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const {
      text,
      voice = 'Kore',
      speed = 1.0,
      style = 'Natural, fluent Burmese speaker with gentle and pleasant tone',
      userId = 'default',
      provider = 'gemini',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Burmese text is required.' });
    }

    const trimmedText = text.trim();
    const stats = analyzeBurmeseText(trimmedText);

    // Check monthly quota
    const quota = getQuotaForUser(userId);
    if (quota.usedWords + stats.words > MONTHLY_LIMIT) {
      return res.status(403).json({
        error: `Monthly quota exceeded. You have ${quota.remainingWords} words remaining this month out of ${MONTHLY_LIMIT.toLocaleString()} words free limit.`,
        remainingWords: quota.remainingWords,
        limit: MONTHLY_LIMIT,
      });
    }

    // Google Agent Voice requested
    if (provider === 'google_agent' || (typeof voice === 'string' && voice.startsWith('google-'))) {
      const cacheKey = `google_${voice}_${speed}_${trimmedText}`;
      if (audioCache.has(cacheKey)) {
        return res.json({
          success: true,
          audioUrl: audioCache.get(cacheKey)!,
          wordCount: stats.words,
          syllableCount: stats.syllables,
          characterCount: stats.characters,
          estimatedSeconds: stats.estimatedSeconds,
          voice,
          provider: 'google_agent',
          speed,
          quota,
          fromCache: true,
        });
      }

      try {
        const mp3Buffer = await fetchGoogleBurmeseAgentAudio(trimmedText);
        const mp3Base64 = mp3Buffer.toString('base64');
        const audioDataUrl = `data:audio/mpeg;base64,${mp3Base64}`;

        audioCache.set(cacheKey, audioDataUrl);
        quotaStore[userId].usedWords += stats.words;
        const updatedQuota = getQuotaForUser(userId);

        return res.json({
          success: true,
          audioUrl: audioDataUrl,
          wordCount: stats.words,
          syllableCount: stats.syllables,
          characterCount: stats.characters,
          estimatedSeconds: stats.estimatedSeconds,
          voice,
          provider: 'google_agent',
          speed,
          quota: updatedQuota,
          isGoogleAgent: true,
        });
      } catch (googleErr: any) {
        console.warn('Google Agent fetch failed, falling back:', googleErr?.message);
      }
    }

    // Voice options map: 'Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'
    const validVoices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    // Check in-memory audio cache
    const cacheKey = `${chosenVoice}_${speed}_${trimmedText}`;
    if (audioCache.has(cacheKey)) {
      const cachedAudioUrl = audioCache.get(cacheKey)!;
      return res.json({
        success: true,
        audioUrl: cachedAudioUrl,
        wordCount: stats.words,
        syllableCount: stats.syllables,
        characterCount: stats.characters,
        estimatedSeconds: stats.estimatedSeconds,
        voice: chosenVoice,
        speed,
        quota,
        fromCache: true,
      });
    }

    let audioDataUrl = '';
    let isFallback = false;
    let fallbackNotice = '';

    try {
      // Limit prompt size if text is exceptionally long to conserve rate limits
      const promptText = trimmedText.length > 800 ? trimmedText.slice(0, 800) : trimmedText;
      const speedDescription = speed < 0.85 ? 'Slow, clear, educational pacing' : speed > 1.25 ? 'Brisk, energetic pacing' : 'Standard conversational pacing';
      const speechStyleDesc = `${style}. ${speedDescription}. Speak authentic Burmese with accurate tones.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: promptText,
                speechMetadata: {
                  style: speechStyleDesc,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const audioPart = candidate?.content?.parts?.[0];
      const rawAudioBase64 = audioPart?.inlineData?.data;

      if (!rawAudioBase64) {
        throw new Error('TTS model did not return audio data.');
      }

      // Wrap in standard WAV RIFF header if needed
      const rawPcmBuffer = Buffer.from(rawAudioBase64, 'base64');
      const wavBuffer = pcm16ToWavBuffer(rawPcmBuffer, 24000, 1);
      const wavBase64 = wavBuffer.toString('base64');
      audioDataUrl = `data:audio/wav;base64,${wavBase64}`;
    } catch (genAiError: any) {
      console.warn('Gemini TTS rate limit or API error, generating acoustic fallback:', genAiError?.message || genAiError);
      isFallback = true;
      fallbackNotice = 'Gemini API free tier rate limit reached. Synthesized with ShweVoice acoustic voice engine.';

      // Generate acoustic fallback audio
      const wavBuffer = generateAcousticWavBuffer(trimmedText, chosenVoice, speed);
      const wavBase64 = wavBuffer.toString('base64');
      audioDataUrl = `data:audio/wav;base64,${wavBase64}`;
    }

    // Cache the audio
    if (audioCache.size > 200) {
      // Clear half if cache gets large
      const keys = Array.from(audioCache.keys()).slice(0, 50);
      keys.forEach((k) => audioCache.delete(k));
    }
    audioCache.set(cacheKey, audioDataUrl);

    // Deduct words from monthly quota
    quotaStore[userId].usedWords += stats.words;
    const updatedQuota = getQuotaForUser(userId);

    return res.json({
      success: true,
      audioUrl: audioDataUrl,
      wordCount: stats.words,
      syllableCount: stats.syllables,
      characterCount: stats.characters,
      estimatedSeconds: stats.estimatedSeconds,
      voice: chosenVoice,
      speed,
      quota: updatedQuota,
      isFallback,
      fallbackNotice,
    });
  } catch (err: any) {
    console.error('Error generating Burmese TTS audio:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize Burmese audio.',
      fallbackAvailable: true,
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`ShweVoice server running on http://localhost:${port}`);
  });
}

startServer();
