/**
 * Acoustic Formant Synthesizer for Burmese Syllables
 * Provides resilient, zero-latency offline / fallback speech generation.
 */

// Burmese vowel formant approximations (F1, F2 in Hz)
const VOWEL_FORMANTS: Record<string, [number, number]> = {
  a: [750, 1250],
  i: [300, 2200],
  u: [320, 800],
  e: [500, 1800],
  o: [450, 900],
  ai: [600, 1600],
  default: [650, 1300],
};

// Consonant frequency weights
function getConsonantFriction(char: string): number {
  const code = char.charCodeAt(0);
  // Sibilants like စ, ဆ, ဇ, ဈ
  if (code >= 0x1005 && code <= 0x1008) return 0.25;
  // Aspirated like ခ, ဃ, ထ, ဖ
  if ([0x1001, 0x1003, 0x1011, 0x1015].includes(code)) return 0.18;
  return 0.05;
}

export function generateBurmeseAcousticWav(
  text: string,
  sampleRate = 22050,
  voicePitch = 160, // 130 for male, 190 for female
  speed = 1.0
): string {
  // Extract syllables
  const syllableRegex = /(?:[\u1000-\u1021\u1023-\u102A\u104E](?:[\u103B-\u103E])*(?:[\u102B-\u1035\u1037\u1038])*(?:[\u1036])*(?:[\u103A]|(?:\u1039[\u1000-\u1021]))*)/g;
  const syllables = text.match(syllableRegex) || [];

  if (syllables.length === 0) {
    // Fallback simple tone if non-burmese
    const durationSec = 1.0;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const pcm = new Int16Array(totalSamples);
    return pcmToWavDataUrl(pcm, sampleRate);
  }

  // Base syllable duration: ~180ms divided by speed
  const syllableDuration = Math.max(0.12, Math.min(0.35, 0.22 / speed));
  const samplesPerSyllable = Math.floor(sampleRate * syllableDuration);
  const pauseSamples = Math.floor(sampleRate * (0.04 / speed));
  const totalSamples = syllables.length * (samplesPerSyllable + pauseSamples);

  const pcm = new Int16Array(totalSamples);
  let sampleOffset = 0;

  for (let sIdx = 0; sIdx < syllables.length; sIdx++) {
    const syl = syllables[sIdx];
    const isSentenceEnd = syl.includes('။') || syl.includes('၊') || (sIdx + 1 < syllables.length && text.charAt(text.indexOf(syl) + syl.length) === '။');

    // Tone analysis
    let toneType: 'low' | 'high' | 'creaky' | 'checked' = 'low';
    if (syl.includes('\u1038')) {
      toneType = 'high'; // Visarga ( heavy / high tone)
    } else if (syl.includes('\u1037')) {
      toneType = 'creaky'; // Dot below (creaky tone)
    } else if (syl.includes('\u103A')) {
      toneType = 'checked'; // Asat stop
    }

    // Formants
    let formants = VOWEL_FORMANTS['default'];
    if (syl.includes('\u102D') || syl.includes('\u102E')) formants = VOWEL_FORMANTS['i'];
    else if (syl.includes('\u102F') || syl.includes('\u1030')) formants = VOWEL_FORMANTS['u'];
    else if (syl.includes('\u1031')) formants = VOWEL_FORMANTS['e'];
    else if (syl.includes('\u102C') || syl.includes('\u102B')) formants = VOWEL_FORMANTS['a'];

    const [f1, f2] = formants;
    const friction = getConsonantFriction(syl[0] || '');

    // Pitch contour for this syllable
    let f0Start = voicePitch;
    let f0End = voicePitch;

    if (toneType === 'high') {
      f0Start = voicePitch * 1.05;
      f0End = voicePitch * 1.25;
    } else if (toneType === 'creaky') {
      f0Start = voicePitch * 1.15;
      f0End = voicePitch * 0.95;
    } else if (toneType === 'checked') {
      f0Start = voicePitch * 1.1;
      f0End = voicePitch * 1.15;
    } else {
      // low tone
      f0Start = voicePitch * 0.95;
      f0End = voicePitch * 0.98;
    }

    let phase = 0;
    const sylLen = toneType === 'checked' ? Math.floor(samplesPerSyllable * 0.7) : samplesPerSyllable;

    for (let i = 0; i < sylLen; i++) {
      const t = i / sylLen;
      // Envelope: gentle rise, sustained, smooth fall
      let env = 1;
      if (t < 0.15) env = t / 0.15;
      else if (t > 0.8) env = (1 - t) / 0.2;

      // Current F0
      const currentF0 = f0Start + (f0End - f0Start) * t;
      phase += (2 * Math.PI * currentF0) / sampleRate;

      // Glottal source (harmonics)
      const glottal =
        Math.sin(phase) +
        0.5 * Math.sin(2 * phase) +
        0.25 * Math.sin(3 * phase) +
        0.12 * Math.sin(4 * phase);

      // Formant resonant peaks
      const f1Val = Math.sin((2 * Math.PI * f1 * i) / sampleRate) * 0.35;
      const f2Val = Math.sin((2 * Math.PI * f2 * i) / sampleRate) * 0.25;

      // Aspiration / breath noise
      const noise = (Math.random() * 2 - 1) * friction;

      const sample = (glottal * 0.5 + f1Val + f2Val + noise) * env * 14000;
      pcm[sampleOffset++] = Math.max(-32767, Math.min(32767, Math.floor(sample)));
    }

    // Inter-syllable pause
    const extraPause = isSentenceEnd ? pauseSamples * 3 : pauseSamples;
    for (let p = 0; p < extraPause; p++) {
      if (sampleOffset < totalSamples) {
        pcm[sampleOffset++] = 0;
      }
    }
  }

  return pcmToWavDataUrl(pcm.subarray(0, sampleOffset), sampleRate);
}

function pcmToWavDataUrl(pcm: Int16Array, sampleRate: number): string {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16-bit

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(offset, pcm[i], true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
