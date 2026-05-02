import base64
import json
import os
import subprocess

ML_PYTHON = os.getenv(
    "ML_PYTHON_PATH",
    r"C:\Users\rajal\Loan-Wizard\backend\ml\venv-ml\Scripts\python.exe",
)


def transcribe_audio_bridge(audio_bytes: bytes) -> dict:
    b64 = base64.b64encode(audio_bytes).decode()

    script = f"""
import base64, json, sys
sys.path.insert(0, r'C:\\Users\\rajal\\Loan-Wizard\\backend')
from ml.stt import transcribe_audio
audio_bytes = base64.b64decode('{b64}')
result = transcribe_audio(audio_bytes)
print(json.dumps({{'transcript': result}}))
"""
    try:
        result = subprocess.run(
            [ML_PYTHON, "-c", script],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            return json.loads(result.stdout.strip())
        return {"transcript": "", "error": result.stderr}
    except Exception as e:
        return {"transcript": "", "error": str(e)}
