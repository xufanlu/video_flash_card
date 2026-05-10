# Korean Video Learn

A small **React + Vite** app for studying Korean from a synchronized music video. It shows line-by-line transcript cards that follow playback, optional English lines, and a **word study** panel with Hangul syllables broken into jamo, short English glosses where available, and grammar hints.

The sample content targets the track *Sudden Shower* (transcript and timings come from a local Whisper run).

## Features

- **Video + transcript sync**: seek and autoplay segments; optional “follow” mode keeps the current line aligned with playback.
- **Word-level timings**: click a word to hear a tight clip around that token (timings from Whisper).
- **Study aids**: [es-hangul](https://github.com/toss/es-hangul)–based jamo breakdown, curated word glosses (`src/data/wordGlosses.ts`), and grammar hints (`src/data/grammarHints.ts`).
- **Hangul reference**: interactive jamo chart component.

## Requirements

- **Node.js** 18+ (for the web app)
- **Python 3.10+** (only if you regenerate transcriptions)
- **ffmpeg** (recommended on macOS for decoding varied media; e.g. `brew install ffmpeg`)

## Run the app

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Video file

The app loads **`/sudden_shower_high_quality.mp4`** (see `DEFAULT_VIDEO_SRC` in `src/App.tsx`). In Vite, put that file in:

```text
public/sudden_shower_high_quality.mp4
```

If the file is missing, the player will error until you add it or change the path in code.

### Build / preview

```bash
npm run build
npm run preview
```

## Transcription pipeline (Python)

Transcripts are stored as JSON with **segments** that include **word-level** timestamps. The app imports `sudden_shower_transcription.json` and maps it in `src/data/sentences.ts`.

### Full pipeline (Korean + English + words)

`whisper.py` runs **faster-whisper** twice (Korean `transcribe` and `translate`) and merges segment-aligned English with Korean text and `word_timestamps`. It writes:

- `sudden_shower_transcription.json` — format the React app expects (`segments[]` with `start`, `end`, `text`, optional `english`, `words[]`).
- `sudden_shower_transcription.txt` — human-readable log.

Adjust `audio_path`, model size, and `device` / `compute_type` at the top of `whisper.py`, then:

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python whisper.py
```

Point `src/data/sentences.ts` at your new JSON (or replace `sudden_shower_transcription.json`) if you use a different filename.

### Lighter CLI helper

`scripts/transcribe_whisper.py` transcribes a file to a **simpler JSON array** (segment times and Korean or translated English only — **no word timestamps** in that output). It is useful for quick runs; for feature parity with the current UI (per-word playback), use the `whisper.py` style output with `words` on each segment.

## Project layout

| Path | Role |
|------|------|
| `src/App.tsx` | Main UI: video, segment list, word study |
| `src/data/sentences.ts` | Loads transcription JSON → flash cards |
| `src/data/wordGlosses.ts`, `grammarHints.ts` | Learner-facing strings |
| `sudden_shower_transcription.json` | Whisper output consumed by the app |
| `whisper.py` | Dual-pass Whisper → JSON + TXT |
| `scripts/transcribe_whisper.py` | Optional simpler transcription CLI |

## Stack

- **Frontend**: React 18, TypeScript, Vite 5
- **Korean text**: `es-hangul`
- **Speech**: `faster-whisper` (CTranslate2) + `huggingface_hub` for models

## Use

This project is intended **only for personal learning**. Do not use it for commercial purposes, public distribution of bundled media, or any other use that would conflict with rights holders’ copyrights or licenses; obtain proper permissions before sharing or publishing any derived work.

