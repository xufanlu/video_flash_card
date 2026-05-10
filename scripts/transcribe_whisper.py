#!/usr/bin/env python3
"""
Transcribe video/audio with faster-whisper and emit JSON for the React app.

Setup (once):
  cd /Users/xufanlu/Video_Learning
  python3 -m venv .venv
  source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
  pip install -r requirements.txt

  # macOS: decoder often needs ffmpeg for some containers
  # brew install ffmpeg

Usage:
  python scripts/transcribe_whisper.py "path/to/video.mp4" -o sentences.json
  python scripts/transcribe_whisper.py audio.wav --model small --device cpu --compute-type int8

Paste JSON into src/data/sentences.ts or load it from a file in the app later.
English lines are left empty unless you add --task translate (then text is English;
use default task transcribe + language ko for Korean lyrics).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe with faster-whisper")
    parser.add_argument(
        "audio",
        type=Path,
        help="Video or audio file (mp4, wav, mp3, m4a, …)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("sentences_from_whisper.json"),
        help="Output JSON path",
    )
    parser.add_argument(
        "--model",
        default="small",
        help="Whisper size: tiny, base, small, medium, large-v2, large-v3, etc.",
    )
    parser.add_argument(
        "--device",
        default="auto",
        help="cpu, cuda, auto",
    )
    parser.add_argument(
        "--compute-type",
        default="default",
        help="default | int8 | float16 | int8_float16 (platform-dependent)",
    )
    parser.add_argument(
        "--language",
        default="ko",
        help="ISO language code (ko for Korean). Use auto for detection.",
    )
    parser.add_argument(
        "--task",
        choices=("transcribe", "translate"),
        default="transcribe",
        help="transcribe = keep language; translate = to English (no Korean text).",
    )
    parser.add_argument(
        "--vad-filter",
        action="store_true",
        help="Voice activity filter (can help music-heavy clips; may drop quiet lines).",
    )
    args = parser.parse_args()

    if not args.audio.is_file():
        print(f"File not found: {args.audio}", file=sys.stderr)
        return 1

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(
            "faster-whisper not installed. Run:\n"
            "  python3 -m venv .venv && source .venv/bin/activate\n"
            "  pip install -r requirements.txt",
            file=sys.stderr,
        )
        return 1

    compute_type = None if args.compute_type == "default" else args.compute_type
    model = WhisperModel(
        args.model,
        device=args.device,
        compute_type=compute_type,
    )

    language = None if args.language == "auto" else args.language

    segments, info = model.transcribe(
        str(args.audio),
        language=language,
        task=args.task,
        vad_filter=args.vad_filter,
        beam_size=5,
    )

    print(f"Detected language: {info.language} (prob {info.language_probability:.2f})", file=sys.stderr)

    out: list[dict] = []
    for seg in segments:
        text = (seg.text or "").strip()
        if not text:
            continue
        if args.task == "translate":
            out.append(
                {
                    "startSec": round(seg.start, 3),
                    "endSec": round(seg.end, 3),
                    "korean": "",
                    "english": text,
                }
            )
        else:
            out.append(
                {
                    "startSec": round(seg.start, 3),
                    "endSec": round(seg.end, 3),
                    "korean": text,
                    "english": "",
                }
            )

    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(out)} segments to {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
