import json
from pathlib import Path

from faster_whisper import WhisperModel

model_size = "large-v3"
audio_path = Path("sudden_shower.mp4")
out_json = Path("sudden_shower_transcription.json")
out_txt = Path("sudden_shower_transcription.txt")

# Run on GPU with FP16
# model = WhisperModel(model_size, device="cuda", compute_type="float16")

# or run on GPU with INT8
# model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")

# or run on CPU with INT8
model = WhisperModel(model_size, device="cpu", compute_type="int8")

# Same knobs for both passes so segment boundaries usually line up for zipping.
TRANSCRIBE_KW = {
    "beam_size": 10,
    "log_progress": True,
    "word_timestamps": True,
}

print("=== Pass 1: transcribe (source language) ===")
segments_ko, info = model.transcribe(
    str(audio_path),
    task="transcribe",
    **TRANSCRIBE_KW,
)
ko_list = list(segments_ko)

print(
    "Detected language '%s' with probability %f" % (info.language, info.language_probability)
)
print("Segments (transcribe): %d" % len(ko_list))

print("\n=== Pass 2: translate → English ===")
segments_en, _info_en = model.transcribe(
    str(audio_path),
    task="translate",
    **TRANSCRIBE_KW,
)
en_list = list(segments_en)
print("Segments (translate): %d" % len(en_list))

if len(ko_list) != len(en_list):
    print(
        "WARNING: segment count mismatch (ko=%d, en=%d); zipping by index up to min length"
        % (len(ko_list), len(en_list))
    )

lines_txt: list[str] = []
payload: dict = {
    "language": info.language,
    "language_probability": float(info.language_probability),
    "source": str(audio_path),
    "segments": [],
}

for i, segment in enumerate(ko_list):
    en_seg = en_list[i] if i < len(en_list) else None
    english = (en_seg.text.strip() if en_seg and en_seg.text else "")

    seg_line = "[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text)
    print(seg_line)
    lines_txt.append(seg_line + "\n")
    if english:
        lines_txt.append("  [EN] %s\n" % english)

    words = segment.words or ()
    word_objs = []
    for word in words:
        wline = "  [%.2fs -> %.2fs] %s" % (word.start, word.end, word.word)
        print(wline)
        lines_txt.append(wline + "\n")
        word_objs.append(
            {
                "start": round(float(word.start), 3),
                "end": round(float(word.end), 3),
                "word": word.word,
            }
        )

    seg_payload = {
        "start": round(float(segment.start), 3),
        "end": round(float(segment.end), 3),
        "text": segment.text.strip(),
        "words": word_objs,
    }
    if english:
        seg_payload["english"] = english

    payload["segments"].append(seg_payload)

out_txt.write_text("".join(lines_txt), encoding="utf-8")
out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("\nWrote %s" % out_txt)
print("Wrote %s" % out_json)
