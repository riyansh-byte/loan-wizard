from enum import Enum

class Decision(str, Enum):
    AUTO_APPROVE = "AUTO_APPROVE"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    DECLINE = "DECLINE"
    BLOCK = "BLOCK"

DECISION_MATRIX = {
    # (risk_band, fraud_band): decision
    ("A", "CLEAN"):       Decision.AUTO_APPROVE,
    ("A", "LOW_RISK"):    Decision.AUTO_APPROVE,
    ("A", "MEDIUM_RISK"): Decision.HUMAN_REVIEW,
    ("A", "HIGH_RISK"):   Decision.BLOCK,
    ("B", "CLEAN"):       Decision.AUTO_APPROVE,
    ("B", "LOW_RISK"):    Decision.AUTO_APPROVE,
    ("B", "MEDIUM_RISK"): Decision.HUMAN_REVIEW,
    ("B", "HIGH_RISK"):   Decision.BLOCK,
    ("C", "CLEAN"):       Decision.HUMAN_REVIEW,
    ("C", "LOW_RISK"):    Decision.HUMAN_REVIEW,
    ("C", "MEDIUM_RISK"): Decision.HUMAN_REVIEW,
    ("C", "HIGH_RISK"):   Decision.BLOCK,
    ("D", "CLEAN"):       Decision.DECLINE,
    ("D", "LOW_RISK"):    Decision.DECLINE,
    ("D", "MEDIUM_RISK"): Decision.BLOCK,
    ("D", "HIGH_RISK"):   Decision.BLOCK,
}

def get_decision(risk_band: str, fraud_band: str) -> Decision:
    key = (risk_band.upper(), fraud_band.upper())
    return DECISION_MATRIX.get(key, Decision.HUMAN_REVIEW)

def get_decision_explanation(decision: Decision, risk_band: str, fraud_score: int) -> str:
    explanations = {
        Decision.AUTO_APPROVE: f"Strong risk profile (Band {risk_band}) with low fraud indicators (score {fraud_score}/100). Proceeding automatically.",
        Decision.HUMAN_REVIEW: f"Application requires manual review due to risk band {risk_band} or fraud score {fraud_score}/100.",
        Decision.DECLINE: f"Risk profile (Band {risk_band}) does not meet minimum eligibility criteria.",
        Decision.BLOCK: f"High fraud signal detected (score {fraud_score}/100). Session blocked for security.",
    }
    return explanations.get(decision, "Decision pending review.")