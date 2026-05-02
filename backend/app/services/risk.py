import pickle
import numpy as np
import os
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent.parent / "ML" / "model.pkl"

_model = None

def load_model():
    global _model
    if _model is None:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
    return _model

RISK_BAND_THRESHOLDS = {
    "A": (0.0,  0.10),
    "B": (0.10, 0.25),
    "C": (0.25, 0.45),
    "D": (0.45, 1.0),
}

def get_risk_band(probability: float) -> str:
    for band, (low, high) in RISK_BAND_THRESHOLDS.items():
        if low <= probability < high:
            return band
    return "D"

def score_application(features: dict) -> dict:
    model = load_model()

    # Map incoming features to model features
    # Handle missing values with sensible defaults
    X = np.array([[
        float(features.get("AMT_INCOME_TOTAL", 300000)),
        float(features.get("AMT_CREDIT", 500000)),
        float(features.get("AMT_ANNUITY", 25000)),
        float(features.get("DAYS_EMPLOYED", -1000)),
        float(features.get("DAYS_BIRTH", -12000)),
        float(features.get("NAME_INCOME_TYPE", 1)),
        float(features.get("NAME_EDUCATION_TYPE", 2)),
        float(features.get("REGION_RATING_CLIENT", 2)),
        float(features.get("CODE_GENDER", 1)),
        float(features.get("EXT_SOURCE_1", 0.5)),
        float(features.get("EXT_SOURCE_2", 0.5)),
        float(features.get("EXT_SOURCE_3", 0.5)),
    ]])

    proba = model.predict_proba(X)[0][1]
    risk_band = get_risk_band(proba)
    max_loan = calculate_max_loan(
        features.get("AMT_INCOME_TOTAL", 300000),
        risk_band
    )

    return {
        "default_probability": round(float(proba), 4),
        "risk_band": risk_band,
        "max_eligible_amount": max_loan,
        "risk_score": round(float(proba) * 100, 1)
    }

def calculate_max_loan(annual_income: float, risk_band: str) -> int:
    multipliers = {"A": 5.0, "B": 4.0, "C": 2.5, "D": 1.0}
    multiplier = multipliers.get(risk_band, 1.0)
    raw = float(annual_income) * multiplier
    # Round to nearest 50,000
    return int(round(raw / 50000) * 50000)