/**
 * Burmese Language Tokenizer and Syllable/Word Analyzer
 */

// Regex matching Burmese syllables according to Unicode Myanmar script
const BURMESE_SYLLABLE_REGEX = /(?:[\u1000-\u1021\u1023-\u102A\u104E](?:[\u103B-\u103E])*(?:[\u102B-\u1035\u1037\u1038])*(?:[\u1036])*(?:[\u103A]|(?:\u1039[\u1000-\u1021]))*)/g;

export interface BurmeseAnalysis {
  words: number;
  syllables: number;
  characters: number;
  sentences: string[];
  estimatedSeconds: number; // At 1.0x speed
}

export function analyzeBurmese(text: string, speed = 1.0): BurmeseAnalysis {
  if (!text || !text.trim()) {
    return {
      words: 0,
      syllables: 0,
      characters: 0,
      sentences: [],
      estimatedSeconds: 0,
    };
  }

  const cleanText = text.trim();
  const characters = cleanText.replace(/\s+/g, '').length;

  // Syllables
  const syllables = cleanText.match(BURMESE_SYLLABLE_REGEX) || [];
  const syllableCount = syllables.length;

  // Latin / digits words
  const latinWords = cleanText.match(/[a-zA-Z0-9_-]+/g) || [];
  const latinWordCount = latinWords.length;

  // In Burmese, compound words consist of an average of ~1.65 syllables.
  const estimatedBurmeseWords = Math.ceil(syllableCount / 1.65);
  const totalWords = Math.max(1, estimatedBurmeseWords + latinWordCount);

  // Split into sentences using Burmese sentence end marks (၊, ။), newlines, and punctuation
  const rawSentences = cleanText
    .split(/(?<=[။\.\?\!\n])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences = rawSentences.length > 0 ? rawSentences : [cleanText];

  // Standard conversational speed: ~150 words per minute at 1.0x
  const baseSeconds = Math.max(1, Math.round((totalWords / 150) * 60));
  const estimatedSeconds = Math.max(1, Math.round(baseSeconds / speed));

  return {
    words: totalWords,
    syllables: syllableCount,
    characters,
    sentences,
    estimatedSeconds,
  };
}

export function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
