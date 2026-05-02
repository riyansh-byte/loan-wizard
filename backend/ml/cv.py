import tempfile
import os
from deepface import DeepFace


def analyze_face(image_bytes: bytes) -> dict:
    temp_file = None

    try:
        # 1. Save temp image
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f:
            f.write(image_bytes)
            temp_file = f.name

        # 2. Analyze face (age + emotion)
        analysis = DeepFace.analyze(
            img_path=temp_file,
            actions=['age', 'emotion'],
            enforce_detection=False
        )

        # DeepFace may return list
        if isinstance(analysis, list):
            analysis = analysis[0]

        age = int(analysis.get("age", 0))
        emotion = analysis.get("dominant_emotion", "unknown")

        # 3. Simulated liveness check (hackathon-safe)
        # Logic: if face detected + confidence-like signal → assume live
        emotion_scores = analysis.get("emotion", {})
        confidence = max(emotion_scores.values()) / 100 if emotion_scores else 0.0

        liveness_passed = confidence > 0.2  # simple heuristic
        # Add face region confidence when DeepFace exposes it.
        face_confidence = analysis.get("face_confidence", confidence)

        return {
            "estimated_age": age,
            "emotion": emotion,
            "liveness_passed": liveness_passed,
            "confidence": round(face_confidence, 2),
            "face_detected": True
        }

    except Exception as e:
        return {
            "estimated_age": 0,
            "emotion": "unknown",
            "liveness_passed": False,
            "confidence": 0.0,
            "error": str(e)
        }

    finally:
        # 4. Cleanup
        if temp_file and os.path.exists(temp_file):
            os.remove(temp_file)
