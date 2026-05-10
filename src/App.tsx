import { useEffect, useRef, useState } from "react";
import {
  SUDDEN_SHOWER_CARDS,
  type SentenceChunk,
  type WordSpan,
} from "./data/sentences";
import { getGrammarHint } from "./data/grammarHints";
import { getWordEnglishGloss } from "./data/wordGlosses";
import {
  jamoBreakdownLine,
  syllablesHangulAndJamo,
} from "./utils/jamoBreakdown";
import styles from "./App.module.css";
import { KoreanJamoChart } from "./components/KoreanJamoChart";

/** Vite serves `public/` at site root; BASE_URL includes the GitHub Pages subpath when deployed. */
const DEFAULT_VIDEO_SRC = `${import.meta.env.BASE_URL}sudden_shower_high_quality.mp4`;

/** Pause slightly before the playback stop time so the decoder rarely spills past it. */
const WORD_CLIP_END_EPS_SEC = 0.018;

/** Extra time past Whisper's word end so tails/releases aren't cut off. */
const WORD_CLIP_END_TAIL_SEC = 0.05;

/**
 * Whisper word starts are often early (previous syllable still audible). Only affects
 * playback seek, not titles/stamps (those stay on transcript times).
 */
const WORD_CLIP_START_TRIM_SEC = 0.30;

/** After trimming start, keep at least this much clip so very short tokens don't disappear. */
const WORD_CLIP_MIN_DURATION_SEC = 0.06;

function wordPlaybackStartSec(w: WordSpan): number {
  const start = w.startSec;
  const end = w.endSec;
  const trimmed = start + WORD_CLIP_START_TRIM_SEC;
  const latestStart = end - WORD_CLIP_MIN_DURATION_SEC;
  return Math.max(start, Math.min(trimmed, latestStart));
}

/**
 * Some browsers report `currentTime ≈ 0` while `ended` is true after the media ended.
 * That would map to line 0 in `lineIndexForPlaybackTime` and clear the word study UI.
 */
function effectivePlaybackClockTime(
  v: HTMLVideoElement,
  chunks: SentenceChunk[],
): number {
  let t = v.currentTime;
  const dur =
    typeof v.duration === "number" && Number.isFinite(v.duration) ? v.duration : NaN;
  if (
    chunks.length > 1 &&
    Number.isFinite(dur) &&
    dur > 1 &&
    v.ended &&
    t <= 0.02 &&
    chunks[0].startSec > 0.5 &&
    chunks[chunks.length - 1].startSec <= dur + 0.08
  ) {
    return dur;
  }
  return t;
}

function clampWordClipRange(
  w: WordSpan,
  dur: number | null,
): { startAt: number; playUntil: number } {
  let playUntil = w.endSec + WORD_CLIP_END_TAIL_SEC;
  let startAt = wordPlaybackStartSec(w);
  const marginSec = 0.02;
  if (dur !== null && Number.isFinite(dur) && dur > WORD_CLIP_MIN_DURATION_SEC + marginSec * 2) {
    const capEnd = dur - marginSec;
    playUntil = Math.min(playUntil, capEnd);
    const minGap = WORD_CLIP_MIN_DURATION_SEC + WORD_CLIP_END_EPS_SEC;
    startAt = Math.min(startAt, playUntil - minGap * 1.1);
    if (startAt < 0 || startAt >= playUntil - WORD_CLIP_END_EPS_SEC) {
      startAt = Math.max(w.startSec, Math.min(playUntil - minGap, capEnd - minGap));
    }
    if (startAt < 0 || startAt >= playUntil - WORD_CLIP_END_EPS_SEC) {
      startAt = Math.max(0, playUntil - Math.max(minGap, 0.07));
    }
  }
  return { startAt, playUntil };
}

/** Line index whose `startSec` is rightmost and still ≤ t (works for contiguous Whisper segments). */
function lineIndexForPlaybackTime(t: number, chunks: SentenceChunk[]): number {
  if (!chunks.length) return 0;
  let lo = 0;
  let hi = chunks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (t < chunks[mid].startSec) hi = mid - 1;
    else lo = mid + 1;
  }
  return Math.min(Math.max(hi, 0), chunks.length - 1);
}

type WordStudyPanelProps = {
  word: WordSpan;
};

function WordStudyPanel({ word }: WordStudyPanelProps) {
  const pairs = syllablesHangulAndJamo(word.text);
  const gloss = getWordEnglishGloss(word.text);

  return (
    <div className={styles.wordStudy}>
      <p className={styles.studyStamp}>
        [{formatSecondsStamp(word.startSec)} -&gt; {formatSecondsStamp(word.endSec)}]
      </p>
      <p className={styles.studyHead}>{word.text}</p>
      {pairs && pairs.length > 0 ? (
        <div className={styles.syllableStrip}>
          {pairs.map((s, i) => (
            <span key={`${s.hangul}-${i}-${s.jamo}`} className={styles.syllableCluster}>
              {i > 0 ? (
                <span className={styles.syllableSep} aria-hidden>
                  ·
                </span>
              ) : null}
              <span className={styles.syllableUnit}>
                <span className={styles.syllableHangul}>{s.hangul}</span>
                <span className={styles.syllableJamo}>{s.jamo}</span>
              </span>
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.jamoLine}>{jamoBreakdownLine(word.text)}</p>
      )}
      <p className={styles.jamoCaption}>
        Hangul syllable with jamo pieces underneath (single fallback line if mixed script).
      </p>
      {gloss ? (
        <>
          <p className={styles.meaningLabel}>English</p>
          <p className={styles.meaningLine}>{gloss}</p>
        </>
      ) : null}
      <p className={styles.grammarLabel}>Grammar</p>
      <p className={styles.grammarBox}>{getGrammarHint(word.text)}</p>
    </div>
  );
}

export function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wordPlayUntilRef = useRef<number | null>(null);
  const wordClipRafRef = useRef<number | null>(null);
  const followSegmentRef = useRef(true);
  const followWasRef = useRef<boolean | null>(null);
  const indexRef = useRef(0);
  const sentencesRef = useRef<SentenceChunk[]>(SUDDEN_SHOWER_CARDS);
  const [sentences] = useState<SentenceChunk[]>(SUDDEN_SHOWER_CARDS);
  const [index, setIndex] = useState(0);
  const [revealEnglish, setRevealEnglish] = useState(true);
  const [followSegment, setFollowSegment] = useState(true);
  const [selectedWord, setSelectedWord] = useState<WordSpan | null>(null);

  const current = sentences[index];
  const hasEnglish = Boolean(current?.english?.trim());
  const words = current?.words ?? [];

  followSegmentRef.current = followSegment;
  indexRef.current = index;
  sentencesRef.current = sentences;

  useEffect(() => {
    setSelectedWord(null);
    wordPlayUntilRef.current = null;
    if (wordClipRafRef.current !== null) {
      cancelAnimationFrame(wordClipRafRef.current);
      wordClipRafRef.current = null;
    }
  }, [index]);

  useEffect(() => {
    return () => {
      if (wordClipRafRef.current !== null) {
        cancelAnimationFrame(wordClipRafRef.current);
        wordClipRafRef.current = null;
      }
    };
  }, []);

  /** First paint: start at line 1 when sentence-follow mode is on (same as before). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !followSegmentRef.current) return;
    const seg = sentencesRef.current[0];
    if (!seg) return;
    v.currentTime = seg.startSec;
    void v.play().catch(() => {
      /* autoplay may be blocked until user gesture */
    });
  }, []);

  /** Turn “follow segment” on → jump to current card’s line start (after having turned it off). */
  useEffect(() => {
    if (followWasRef.current === null) {
      followWasRef.current = followSegment;
      return;
    }
    const was = followWasRef.current;
    followWasRef.current = followSegment;
    if (!followSegment || was) return;
    const v = videoRef.current;
    const i = indexRef.current;
    const seg = sentencesRef.current[i];
    if (v && seg) {
      v.currentTime = seg.startSec;
      void v.play().catch(() => {
        /* autoplay may be blocked until user gesture */
      });
    }
  }, [followSegment]);

  /** When leaving “stop at sentence end” mode, align the flash card with the playhead. */
  useEffect(() => {
    if (followSegment) return;
    const v = videoRef.current;
    if (!v || !sentences.length) return;
    const i = lineIndexForPlaybackTime(v.currentTime, sentences);
    setIndex(i);
  }, [followSegment, sentences]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onSeeked = () => {
      if (!followSegmentRef.current) return;
      const chunks = sentencesRef.current;
      const t = effectivePlaybackClockTime(v, chunks);
      let i = lineIndexForPlaybackTime(t, chunks);
      const cur = indexRef.current;
      const curSeg = chunks[cur];
      /**
       * If the next segment shares a boundary timestamp with this one's end, a seek to
       * `endSec` (e.g. after a word clip) maps to the next line — keep the current card.
       */
      if (
        curSeg &&
        i > cur &&
        t <= curSeg.endSec + 1e-3
      ) {
        i = cur;
      }
      setIndex((prev) => (prev !== i ? i : prev));
    };

    const onTimeUpdate = () => {
      if (v.seeking) return;

      const follow = followSegmentRef.current;
      const chunks = sentencesRef.current;
      const i = indexRef.current;

      if (follow) {
        const at = lineIndexForPlaybackTime(v.currentTime, chunks);
        const seg = chunks[at];
        if (!seg) return;
        if (v.currentTime >= seg.endSec - 0.05) {
          v.pause();
          v.currentTime = seg.endSec;
        }
        return;
      }

      if (!follow) {
        const tEff = effectivePlaybackClockTime(v, chunks);
        const next = lineIndexForPlaybackTime(tEff, chunks);
        if (next !== i) setIndex(next);
      }
    };

    v.addEventListener("seeked", onSeeked);
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = sentencesRef.current.length;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const i = indexRef.current;
        const ni = Math.min(i + 1, n - 1);
        if (ni === i) return;
        setIndex(ni);
        const v = videoRef.current;
        const seg = sentencesRef.current[ni];
        if (v && seg) {
          v.currentTime = seg.startSec;
          if (followSegmentRef.current) void v.play().catch(() => {});
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const i = indexRef.current;
        const ni = Math.max(i - 1, 0);
        if (ni === i) return;
        setIndex(ni);
        const v = videoRef.current;
        const seg = sentencesRef.current[ni];
        if (v && seg) {
          v.currentTime = seg.startSec;
          if (followSegmentRef.current) void v.play().catch(() => {});
        }
      } else if (e.key === " " || e.key === "Spacebar") {
        const v = videoRef.current;
        if (v) {
          e.preventDefault();
          if (v.paused) void v.play();
          else v.pause();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goLine = (nextIndex: number) => {
    setIndex(nextIndex);
    const v = videoRef.current;
    const seg = sentences[nextIndex];
    if (!v || !seg) return;
    v.currentTime = seg.startSec;
    if (followSegment) void v.play().catch(() => {});
  };

  const goPrev = () => goLine(Math.max(index - 1, 0));
  const goNext = () => goLine(Math.min(index + 1, sentences.length - 1));

  const replayLine = () => {
    const v = videoRef.current;
    if (!v || !current) return;
    wordPlayUntilRef.current = null;
    if (wordClipRafRef.current !== null) {
      cancelAnimationFrame(wordClipRafRef.current);
      wordClipRafRef.current = null;
    }
    v.currentTime = current.startSec;
    void v.play();
  };

  const playWordClip = (w: WordSpan) => {
    const v = videoRef.current;
    if (!v) return;

    if (wordClipRafRef.current !== null) {
      cancelAnimationFrame(wordClipRafRef.current);
      wordClipRafRef.current = null;
    }

    const dur =
      typeof v.duration === "number" && Number.isFinite(v.duration) && v.duration > 0
        ? v.duration
        : null;
    let { startAt, playUntil } = clampWordClipRange(w, dur);
    if (followSegmentRef.current) {
      const seg = sentencesRef.current[indexRef.current];
      if (seg && Number.isFinite(seg.endSec)) {
        playUntil = Math.min(playUntil, seg.endSec);
        if (playUntil <= startAt) {
          playUntil = Math.min(
            seg.endSec,
            startAt + WORD_CLIP_MIN_DURATION_SEC + WORD_CLIP_END_EPS_SEC,
          );
        }
      }
    }
    wordPlayUntilRef.current = playUntil;

    const stopClip = () => {
      v.pause();
      v.currentTime = playUntil;
      wordPlayUntilRef.current = null;
      if (wordClipRafRef.current !== null) {
        cancelAnimationFrame(wordClipRafRef.current);
        wordClipRafRef.current = null;
      }
    };

    const loop = () => {
      if (wordPlayUntilRef.current === null) {
        wordClipRafRef.current = null;
        return;
      }
      if (v.currentTime >= playUntil - WORD_CLIP_END_EPS_SEC) {
        stopClip();
        return;
      }
      wordClipRafRef.current = requestAnimationFrame(loop);
    };

    const afterSeek = () => {
      v.removeEventListener("seeked", onSeeked);
      void v.play().catch(() => {});
      wordClipRafRef.current = requestAnimationFrame(loop);
    };

    const onSeeked = () => {
      afterSeek();
    };

    v.addEventListener("seeked", onSeeked);
    v.currentTime = startAt;
    if (!v.seeking) {
      v.removeEventListener("seeked", onSeeked);
      queueMicrotask(afterSeek);
    }
  };

  const onWordActivate = (w: WordSpan) => {
    setSelectedWord(w);
    playWordClip(w);
  };

  const selectedKey =
    selectedWord &&
    `${selectedWord.startSec}:${selectedWord.endSec}:${selectedWord.text}`;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sudden Shower · line learner</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.videoPanel}>
          <div className={styles.videoWrap}>
            <video
              ref={videoRef}
              className={styles.video}
              src={DEFAULT_VIDEO_SRC}
              controls
              playsInline
            />
          </div>
          <div className={styles.videoMeta}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={followSegment}
                onChange={(e) => setFollowSegment(e.target.checked)}
              />
              Jump &amp; stop at sentence end
            </label>
            <button type="button" className={styles.ghostBtn} onClick={replayLine}>
              Replay this line
            </button>
          </div>
          <KoreanJamoChart />
        </section>

        <section className={styles.cardPanel}>
          <div className={styles.progress}>
            <span>
              Line {index + 1} / {sentences.length}
            </span>
            <span className={styles.timeHint}>
              {current
                ? `${formatTime(current.startSec)} → ${formatTime(current.endSec)}`
                : ""}
            </span>
          </div>

          <div className={styles.flashCard}>

            {words.length ? (
              <p className={styles.koreanLine}>
                {words.map((w, i) => {
                  const key = `${w.startSec}:${w.endSec}:${w.text}:${i}`;
                  const active =
                    selectedKey === `${w.startSec}:${w.endSec}:${w.text}`;
                  const stamp = `[${formatSecondsStamp(w.startSec)} -> ${formatSecondsStamp(w.endSec)}]`;
                  return (
                    <span key={key} className={styles.koreanWordWrap}>
                      {i > 0 ? " " : null}
                      <button
                        type="button"
                        className={`${styles.inlineWord} ${active ? styles.inlineWordActive : ""}`}
                        onClick={() => onWordActivate(w)}
                        aria-pressed={active}
                        title={`${stamp} ${w.text}`}
                        aria-label={`${stamp} ${w.text}`}
                      >
                        {w.text}
                      </button>
                    </span>
                  );
                })}
              </p>
            ) : (
              <p className={styles.korean}>{current?.korean}</p>
            )}

            {selectedWord ? (
              <WordStudyPanel word={selectedWord} />
            ) : (
              <p className={styles.studyPlaceholder}>
                Tap a word for syllables + English gloss + grammar + jamo.
              </p>
            )}

            {hasEnglish ? (
              <>
                <div className={styles.divider} />
                <div className={styles.enRow}>
                  <p className={styles.label}>English</p>
                  <button
                    type="button"
                    className={styles.peekBtn}
                    onClick={() => setRevealEnglish((r) => !r)}
                    aria-expanded={revealEnglish}
                  >
                    {revealEnglish ? "Hide" : "Show"} translation
                  </button>
                </div>
                {revealEnglish ? (
                  <p className={styles.english}>{current?.english}</p>
                ) : (
                  <p className={styles.englishHidden}>· · ·</p>
                )}
              </>
            ) : null}
          </div>

          <div className={styles.nav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goPrev}
              disabled={index <= 0}
            >
              ← Previous
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={goNext}
              disabled={index >= sentences.length - 1}
            >
              Next →
            </button>
          </div>
          <p className={styles.hint}>
            Shortcuts: ← → lines · Space play/pause
          </p>
        </section>
      </main>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSecondsStamp(sec: number): string {
  return `${sec.toFixed(2)}s`;
}
