import transcription from "../../sudden_shower_transcription.json";

export type WordSpan = {
  startSec: number;
  endSec: number;
  /** Surface form (trimmed, no leading Whisper space) */
  text: string;
};

export type SentenceChunk = {
  /** Seconds from start of video */
  startSec: number;
  endSec: number;
  korean: string;
  /** Optional gloss; transcription has Korean only */
  english?: string;
  /** Whisper word-level timings when present */
  words?: WordSpan[];
};

type RawSegment = {
  start: number;
  end: number;
  text: string;
  english?: string;
  words?: { start: number; end: number; word: string }[];
};

const MIN_DURATION = 0.2;

function toWordSpan(w: { start: number; end: number; word: string }): WordSpan | null {
  const text = w.word.trim();
  if (!text) return null;
  let start = w.start;
  let end = w.end;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (end <= start) end = start + MIN_DURATION;
  return { startSec: start, endSec: end, text };
}

function toChunk(seg: RawSegment): SentenceChunk | null {
  const korean = seg.text.trim();
  if (!korean) return null;

  let start = seg.start;
  let end = seg.end;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (end <= start) end = start + MIN_DURATION;

  const englishRaw = seg.english?.trim();
  const words =
    seg.words?.map(toWordSpan).filter((x): x is WordSpan => x !== null) ?? [];
  return {
    startSec: start,
    endSec: end,
    korean,
    ...(englishRaw ? { english: englishRaw } : {}),
    ...(words.length ? { words } : {}),
  };
}

/**
 * One flash card per Whisper segment — same timing as `sudden_shower_transcription.txt` / `.json`.
 */
export const SUDDEN_SHOWER_CARDS: SentenceChunk[] = (
  transcription as { segments: RawSegment[] }
).segments.map(toChunk).filter((c): c is SentenceChunk => c !== null);
