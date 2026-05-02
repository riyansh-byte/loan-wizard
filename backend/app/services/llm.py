import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("Missing GROQ_API_KEY in environment")

client = Groq(
    api_key=GROQ_API_KEY,
    timeout=10
)

# -------------------------------
# Utility: Safe JSON Parsing
# -------------------------------
def safe_json_parse(content: str):
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {
            "error": "Invalid JSON from LLM",
            "raw": content
        }

# -------------------------------
# Fallback Offer Generator
# -------------------------------
def fallback_generate(max_amount: int):
    def calc_emi(p, r, n):
        r = r / 12 / 100
        return int(p * r * (1 + r)**n / ((1 + r)**n - 1))

    conservative = int(max_amount * 0.6)
    standard = int(max_amount * 0.8)
    aggressive = int(max_amount)

    return {
        "offers": [
            {
                "variant": "conservative",
                "amount": conservative,
                "tenure_months": 36,
                "interest_rate": 10.5,
                "emi": calc_emi(conservative, 10.5, 36),
                "total_payable": calc_emi(conservative, 10.5, 36) * 36,
                "label": "Safe Choice",
                "description": "Lower EMI with longer tenure for safety"
            },
            {
                "variant": "standard",
                "amount": standard,
                "tenure_months": 24,
                "interest_rate": 11.5,
                "emi": calc_emi(standard, 11.5, 24),
                "total_payable": calc_emi(standard, 11.5, 24) * 24,
                "label": "Most Popular",
                "description": "Balanced EMI and tenure"
            },
            {
                "variant": "aggressive",
                "amount": aggressive,
                "tenure_months": 12,
                "interest_rate": 13.0,
                "emi": calc_emi(aggressive, 13.0, 12),
                "total_payable": calc_emi(aggressive, 13.0, 12) * 12,
                "label": "Maximum Benefit",
                "description": "Higher EMI but faster repayment"
            }
        ],
        "decision_explanation": "Offers generated using fallback logic based on eligibility.",
        "confidence_percent": 75,
        "fallback": True
    }

# -------------------------------
# Intent Classification
# -------------------------------
def classify_intent_and_extract(transcript: str) -> dict:
    prompt = f"""
You are a loan officer AI analyzing a customer's video call transcript.

Transcript:
{transcript}

Return ONLY valid JSON with this exact structure:
{{
  "customer_name": "full name mentioned",
  "declared_income": 0,
  "employment_type": "Salaried|Self-employed|Business|Student|Other",
  "loan_purpose": "specific purpose stated",
  "declared_age": 0,
  "loan_amount_requested": 0,
  "intent_score": 1,
  "intent_inconsistent": false,
  "intent_flags": [],
  "persona": "Conservative Borrower|Growth-Oriented Professional|Risk-Taker|Cautious First-Timer",
  "confidence": 0.85,
  "consent_phrase": "exact words of consent if found",
  "consent_captured": false
}}

Return ONLY the JSON object, no markdown, no explanation.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        content = response.choices[0].message.content
        parsed = safe_json_parse(content)

        return parsed

    except Exception as e:
        return {
            "error": str(e),
            "customer_name": "Unknown",
            "declared_income": 0,
            "employment_type": "Unknown",
            "loan_purpose": "Unknown",
            "intent_score": 1,
            "intent_inconsistent": True,
            "confidence": 0.0,
            "consent_captured": False
        }

# -------------------------------
# Offer Generation
# -------------------------------
def generate_offer_narration(
    risk_band: str,
    fraud_score: int,
    max_amount: int,
    loan_purpose: str,
    persona: str
) -> dict:

    prompt = f"""
You are a loan offer specialist at Poonawalla Fincorp.
Generate 3 personalised loan offer variants.

Customer profile:
- Risk Band: {risk_band}
- Fraud Score: {fraud_score}/100
- Maximum Eligible Amount: {max_amount}
- Loan Purpose: {loan_purpose}
- Customer Persona: {persona}

Return ONLY valid JSON:
{{
  "offers": [
    {{
      "variant": "conservative",
      "amount": 0,
      "tenure_months": 0,
      "interest_rate": 0.0,
      "emi": 0,
      "total_payable": 0,
      "label": "Safe Choice",
      "description": "one sentence why this is good for them"
    }},
    {{
      "variant": "standard",
      "amount": 0,
      "tenure_months": 0,
      "interest_rate": 0.0,
      "emi": 0,
      "total_payable": 0,
      "label": "Most Popular",
      "description": "one sentence"
    }},
    {{
      "variant": "aggressive",
      "amount": 0,
      "tenure_months": 0,
      "interest_rate": 0.0,
      "emi": 0,
      "total_payable": 0,
      "label": "Maximum Benefit",
      "description": "one sentence"
    }}
  ],
  "decision_explanation": "2 sentence plain English explanation",
  "positive_factors": ["factor1", "factor2"],
  "negative_factors": ["factor1"],
  "confidence_percent": 82
}}

Rules:
- Conservative: 60% of max amount
- Standard: 80% of max amount
- Aggressive: 100% of max amount
- Interest rates: Band A: 9.5-11%, B: 11-13%, C: 13-16%, D: 16-20%
- Return ONLY JSON, no markdown
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        content = response.choices[0].message.content
        parsed = safe_json_parse(content)

        # If JSON parse failed → fallback
        if "error" in parsed:
            return fallback_generate(max_amount)

        return parsed

    except Exception:
        return fallback_generate(max_amount)