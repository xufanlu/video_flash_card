import raw from "./wordGlosses.json";

const gloss = raw as Record<string, string>;

/** Short English gloss for Whisper surface chunks from Sudden Shower. */
export function getWordEnglishGloss(word: string): string | undefined {
  const key = word.trim();
  return gloss[key];
}
