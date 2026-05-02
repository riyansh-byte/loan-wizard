import base64
import json
import os
import subprocess

ML_PYTHON = os.getenv(
    "ML_PYTHON_PATH",
    r"C:\Users\rajal\Loan-Wizard\backend\ml\venv-ml\Scripts\python.exe",
)


def analyze_face_bridge(image_bytes: bytes) -> dict:
    b64 = base64.b64encode(image_bytes).decode()

    script = f"""
import base64, json, sys
sys.path.insert(0, r'C:\\Users\\rajal\\Loan-Wizard\\backend')
from ml.cv import analyze_face
image_bytes = base64.b64decode('{b64}')
result = analyze_face(image_bytes)
print(json.dumps(result))
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
        return {
            "estimated_age": 0,
            "emotion": "unknown",
            "liveness_passed": False,
            "confidence": 0.0,
            "error": result.stderr,
        }
    except Exception as e:
        return {
            "estimated_age": 0,
            "emotion": "unknown",
            "liveness_passed": False,
            "confidence": 0.0,
            "error": str(e),
        }
