import {
  BASIC_CONSONANTS,
  BASIC_VOWELS,
  COMPOUND_VOWELS,
  TENSE_CONSONANTS,
  type JamoTile,
} from "../data/jamoChart";
import styles from "./KoreanJamoChart.module.css";

function speakKoreanKo(text: string) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth || !text.trim()) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.92;
  synth.speak(u);
}

function JamoRow({ label, tiles }: { label: string; tiles: JamoTile[] }) {
  return (
    <>
      <p className={styles.chartRowLabel}>{label}</p>
      <div className={styles.tileRow}>
        {tiles.map((tile) => (
          <button
            key={`${label}-${tile.glyph}`}
            type="button"
            className={styles.jamoTile}
            aria-label={`Play syllable ${tile.speakText} (${tile.roman}), jamo ${tile.glyph}`}
            title={`Speak: ${tile.speakText} · ${tile.roman}`}
            onClick={() => speakKoreanKo(tile.speakText)}
          >
            <span className={styles.tileInner}>
              <span className={styles.glyph}>{tile.glyph}</span>
              <span className={styles.roman} lang="ko-Latn">
                {tile.roman}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

export function KoreanJamoChart() {
  return (
    <div className={styles.jamoChart} role="region" aria-label="Korean jamo chart with audio">
      <div className={styles.chartHeading}>
        <strong>Jamo chart</strong>
        <span className={styles.chartHint}>
          Tap — KR voice. Latin spelling is Revised Romanization (European letters).
        </span>
      </div>
      <div className={styles.chartSections}>
        <div className={styles.chartSection}>
          <JamoRow label="자음 기본 (14)" tiles={BASIC_CONSONANTS} />
          <JamoRow label="쌍자음 (5)" tiles={TENSE_CONSONANTS} />
        </div>
        <div className={styles.chartSection}>
          <JamoRow label="모음 기본 (10)" tiles={BASIC_VOWELS} />
          <JamoRow label="모음 확장 (11)" tiles={COMPOUND_VOWELS} />
        </div>
      </div>
    </div>
  );
}
