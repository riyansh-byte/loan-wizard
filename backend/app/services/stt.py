import whisper
import tempfile
import os

# Load model once (IMPORTANT for performance)
model = whisper.load_model("base")


def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribe raw audio bytes using Whisper (local model)
    """

    temp_file = None

    try:
        # 1. Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
            f.write(audio_bytes)
            temp_file = f.name

        # 2. Transcribe
        result = model.transcribe(temp_file)

        # 3. Extract text
        transcript = result.get("text", "").strip()

        return transcript

    except Exception as e:
        return f"STT_ERROR: {str(e)}"

    finally:
        # 4. Cleanup temp file
        if temp_file and os.path.exists(temp_file):
            os.remove(temp_file)