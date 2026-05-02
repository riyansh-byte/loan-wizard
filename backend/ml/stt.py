import os
import tempfile
import math

import whisper

MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
model = whisper.load_model(MODEL_SIZE)


def transcribe_audio(audio_bytes: bytes) -> dict:
    temp_file = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
            f.write(audio_bytes)
            temp_file = f.name

        result = model.transcribe(temp_file, language="en", fp16=False)

        transcript = result.get("text", "").strip()
        confidence = 0.9

        segments = result.get("segments", [])
        if segments:
            probs = []
            for segment in segments:
                avg_logprob = segment.get("avg_logprob")
                if avg_logprob is not None:
                    probs.append(max(0.0, min(1.0, float(math.exp(avg_logprob)))))
            if probs:
                confidence = round(sum(probs) / len(probs), 2)

        return {
            "transcript": transcript,
            "confidence": confidence,
        }

    except Exception as e:
        return {
            "transcript": "",
            "confidence": 0.0,
            "error": str(e),
        }

    finally:
        if temp_file and os.path.exists(temp_file):
            os.remove(temp_file)
