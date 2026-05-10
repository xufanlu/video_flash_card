/**
 * Standard 한글 자모 charts (consonants + vowels).
 * Consonants use CV syllables + 아 so TTS plays the consonant sound, not letter names.
 * `roman` uses Revised Romanization–style Latin (common Korean-spelling cue for Europeans).
 */
export type JamoTile = {
  glyph: string;
  /** Text for SpeechSynthesis (Korean locale). */
  speakText: string;
  /** Approximate pronunciation in Latin letters (RR). */
  roman: string;
};

/** 초성 순서 — speakText는 “ㅏ” 받침 없는 음가 (예: ㄱ → 가). */
export const BASIC_CONSONANTS: JamoTile[] = [
  { glyph: "ㄱ", speakText: "가", roman: "ga" },
  { glyph: "ㄴ", speakText: "나", roman: "na" },
  { glyph: "ㄷ", speakText: "다", roman: "da" },
  { glyph: "ㄹ", speakText: "라", roman: "ra" },
  { glyph: "ㅁ", speakText: "마", roman: "ma" },
  { glyph: "ㅂ", speakText: "바", roman: "ba" },
  { glyph: "ㅅ", speakText: "사", roman: "sa" },
  { glyph: "ㅇ", speakText: "아", roman: "a" },
  { glyph: "ㅈ", speakText: "자", roman: "ja" },
  { glyph: "ㅊ", speakText: "차", roman: "cha" },
  { glyph: "ㅋ", speakText: "카", roman: "ka" },
  { glyph: "ㅌ", speakText: "타", roman: "ta" },
  { glyph: "ㅍ", speakText: "파", roman: "pa" },
  { glyph: "ㅎ", speakText: "하", roman: "ha" },
];

export const TENSE_CONSONANTS: JamoTile[] = [
  { glyph: "ㄲ", speakText: "까", roman: "kka" },
  { glyph: "ㄸ", speakText: "따", roman: "tta" },
  { glyph: "ㅃ", speakText: "빠", roman: "ppa" },
  { glyph: "ㅆ", speakText: "싸", roman: "ssa" },
  { glyph: "ㅉ", speakText: "짜", roman: "jja" },
];

export const BASIC_VOWELS: JamoTile[] = [
  { glyph: "ㅏ", speakText: "아", roman: "a" },
  { glyph: "ㅑ", speakText: "야", roman: "ya" },
  { glyph: "ㅓ", speakText: "어", roman: "eo" },
  { glyph: "ㅕ", speakText: "여", roman: "yeo" },
  { glyph: "ㅗ", speakText: "오", roman: "o" },
  { glyph: "ㅛ", speakText: "요", roman: "yo" },
  { glyph: "ㅜ", speakText: "우", roman: "u" },
  { glyph: "ㅠ", speakText: "유", roman: "yu" },
  { glyph: "ㅡ", speakText: "으", roman: "eu" },
  { glyph: "ㅣ", speakText: "이", roman: "i" },
];

/** 복합 모음 확장 줄. */
export const COMPOUND_VOWELS: JamoTile[] = [
  { glyph: "ㅐ", speakText: "애", roman: "ae" },
  { glyph: "ㅒ", speakText: "얘", roman: "yae" },
  { glyph: "ㅔ", speakText: "에", roman: "e" },
  { glyph: "ㅖ", speakText: "예", roman: "ye" },
  { glyph: "ㅘ", speakText: "와", roman: "wa" },
  { glyph: "ㅙ", speakText: "왜", roman: "wae" },
  { glyph: "ㅚ", speakText: "외", roman: "oe" },
  { glyph: "ㅝ", speakText: "워", roman: "wo" },
  { glyph: "ㅞ", speakText: "웨", roman: "we" },
  { glyph: "ㅟ", speakText: "위", roman: "wi" },
  { glyph: "ㅢ", speakText: "의", roman: "ui" },
];
