import { disassembleToGroups } from "es-hangul";

export type SyllableJamo = {
  hangul: string;
  jamo: string;
};

function isHangulSyllableChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

/** Groups produced by es-hangul for pronounced Hangul syllables (excludes spaces / latin). */
function isHangulJamoGroup(g: string[]): boolean {
  const s = g.join("");
  if (s === " ") return false;
  return g.every((ch) => /[ㄱ-ㅎㅏ-ㅣ]/.test(ch));
}

/**
 * Pair each Hangul syllable block with its jamo letters (ㄱㅡ …).
 * Returns null if transcript mixes scripts so counts don’t line up.
 */
export function syllablesHangulAndJamo(text: string): SyllableJamo[] | null {
  const t = text.trim();
  if (!t) return [];

  const groups = disassembleToGroups(t).filter(isHangulJamoGroup);
  const hangulChars = [...t].filter(isHangulSyllableChar);
  if (hangulChars.length !== groups.length) return null;

  return hangulChars.map((hangul, i) => ({
    hangul,
    jamo: groups[i].join(""),
  }));
}

/**
 * Spell out pronunciation using Hangul jamo (letter pieces), syllable by syllable.
 * Syllables inside a word are separated by " · "; spaces stay as word boundaries.
 */
export function jamoBreakdownLine(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const groups = disassembleToGroups(trimmed);
  const segments: string[] = [];
  let syllablesInWord: string[] = [];

  const flushWord = () => {
    if (syllablesInWord.length === 0) return;
    segments.push(syllablesInWord.join(" · "));
    syllablesInWord = [];
  };

  for (const g of groups) {
    const piece = g.join("");
    if (piece === " ") {
      flushWord();
      segments.push(" ");
      continue;
    }
    syllablesInWord.push(piece);
  }
  flushWord();

  return segments.join("");
}
