# Loan Wizard

**Agentic AI Video Call–Based Loan Onboarding System**

An end-to-end digital loan origination platform that replaces traditional paper-based applications with a live video call. The system captures customer identity, income declaration, intent, and consent in real time — then scores risk, detects fraud, and generates a personalised loan offer with a full immutable audit trail.

---

## Project Status

### Phase 1 — Mock Environment ✅ Complete

The complete system has been built and validated in a local Docker environment. All services are functional, all endpoints are tested, and the full customer journey works end-to-end with mock data.

### Phase 2 — AWS Production Backend 🔄 In Progress

Migration from local Docker to real AWS infrastructure. All code is already architected for AWS — environment variable swaps replace local endpoints with real AWS service URLs.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  Customer App (React + Vite)  │  Admin Dashboard (React) │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              API GATEWAY + SECURITY                      │
│  JWT Auth · Rate Limiting · VPN Detection · WAF          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│           FASTAPI CORE (Application Brain)               │
│                                                          │
│  Session Orchestrator  │  Fraud Signal Engine (9 signals)│
│  Decision Engine       │  XGBoost Risk Scorer            │
│  LLM Orchestrator      │  Explainability Layer           │
│  Offer Engine          │  HITL Admin Override            │
└──────┬──────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│              ASYNC PROCESSING LAYER                      │
│  SQS Fan-out → STT Lambda · CV Lambda · OCR Lambda      │
│  Step Functions State Machine                            │
└──────┬──────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────┐
│                   STORAGE LAYER                          │
│  S3 (video · docs · frames)  │  DynamoDB (sessions · audit)│
│  PostgreSQL (loan apps · policy configs)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Data fetching | React Query v5 (5s polling) |
| Video | WebRTC getUserMedia (native browser) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Typography | DM Sans + DM Mono (Google Fonts) |
| Deployment | Vercel |

### Backend
| Layer | Technology |
|---|---|
| API framework | FastAPI (Python 3.11) |
| Authentication | JWT (python-jose, HS256) |
| Password hashing | bcrypt (passlib) |
| ML — risk scoring | XGBoost (trained on Home Credit dataset, AUC 0.7497) |
| ML — speech to text | OpenAI Whisper (base model, local) |
| ML — face analysis | DeepFace (age estimation + liveness) |
| LLM — offer generation | Groq (llama-3.3-70b-versatile) |
| OCR — document extraction | AWS Textract |
| Email | SMTP (Gmail) |

### Infrastructure
| Service | Phase 1 (Local) | Phase 2 (AWS) |
|---|---|---|
| Database (sessions/audit) | DynamoDB Local | AWS DynamoDB |
| Object storage | LocalStack S3 | AWS S3 |
| Message queue | LocalStack SQS | AWS SQS |
| Processing functions | Python functions | AWS Lambda |
| Orchestration | Local Step Functions mock | AWS Step Functions |
| Relational database | PostgreSQL (Docker) | AWS RDS PostgreSQL |
| Logs | Console + file | AWS CloudWatch |

---

## Repository Structure

```
loan-wizard/
├── frontend/                          # React + Vite
│   └── src/
│       ├── pages/
│       │   ├── VideoCall.jsx          # WebRTC camera session
│       │   ├── Review.jsx             # HITL pre-filled form
│       │   ├── Offer.jsx              # 3-variant offer display
│       │   ├── Consent.jsx            # Digital consent + signature
│       │   ├── Success.jsx            # Application confirmation
│       │   ├── Dashboard.jsx          # Admin session list
│       │   ├── SessionDetail.jsx      # Audit timeline + fraud panel
│       │   ├── Login.jsx              # Admin authentication
│       │   ├── CustomerLogin.jsx      # Customer portal login
│       │   ├── ChangePassword.jsx     # Forced password change
│       │   ├── CustomerPortal.jsx     # Customer application status
│       │   └── ProjectOverview.jsx    # System overview page
│       ├── components/
│       │   ├── ui/                    # Button, Card, StatusChip, FraudScoreBar
│       │   └── ProtectedRoute.jsx     # JWT-gated route wrapper
│       ├── api/
│       │   ├── client.js              # Axios instance (base: /api/v1)
│       │   └── auth.js                # JWT storage + helpers
│       └── styles/
│           └── tokens.css             # PF design system CSS variables
│
├── backend/                           # FastAPI (Python 3.11)
│   ├── app/
│   │   ├── main.py                    # App entry, CORS, startup events
│   │   ├── core/
│   │   │   └── security.py            # JWT create + verify
│   │   ├── dependencies/
│   │   │   └── auth.py                # get_current_user, require_admin
│   │   ├── routers/
│   │   │   ├── session.py             # /session/* endpoints
│   │   │   ├── offer.py               # /offer/generate
│   │   │   ├── webhook.py             # /webhook/stt|cv|ocr-complete
│   │   │   ├── audit.py               # /audit/{session_id}
│   │   │   ├── dashboard.py           # /dashboard/sessions
│   │   │   └── auth.py                # /auth/login|send-temp-password|change-password
│   │   ├── services/
│   │   │   ├── fraud.py               # 9-signal fraud engine
│   │   │   ├── decision.py            # Risk × fraud decision matrix
│   │   │   ├── risk.py                # XGBoost inference
│   │   │   ├── llm.py                 # Groq LLM orchestrator
│   │   │   ├── explainability.py      # Confidence + factor output
│   │   │   ├── offer.py               # 3-variant offer generation
│   │   │   ├── email_service.py       # SMTP temp password email
│   │   │   ├── stt_bridge.py          # Subprocess bridge → ml venv
│   │   │   └── cv_bridge.py           # Subprocess bridge → ml venv
│   │   └── adapters/
│   │       ├── dynamo.py              # All DynamoDB operations
│   │       ├── s3.py                  # Presigned URL generation
│   │       └── sqs.py                 # Fan-out message sender
│   ├── ml/
│   │   ├── train.py                   # XGBoost training pipeline
│   │   ├── model.pkl                  # Trained model (AUC 0.7497)
│   │   ├── stt.py                     # Whisper transcription service
│   │   ├── cv.py                      # DeepFace face analysis service
│   │   ├── ocr.py                     # Textract document extraction
│   │   └── data/
│   │       └── application_train.csv  # Home Credit dataset (166MB)
│   ├── infra/
│   │   ├── create_tables.py           # DynamoDB table creation
│   │   └── seed_admin.py              # Admin user provisioning
│   ├── requirements.txt               # Web venv dependencies
│   └── venv/                          # Web backend virtual environment
│
├── lambdas/                           # AWS Lambda function wrappers (Phase 2)
│   ├── stt/                           # Whisper Lambda handler
│   ├── cv/                            # DeepFace Lambda handler
│   ├── ocr/                           # Textract Lambda handler
│   └── summariser/                    # S3-triggered video summariser
│
├── infra/
│   ├── docker-compose.yml             # Local development infrastructure
│   └── step_functions.json            # State machine definition
│
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Desktop

### Step 1 — Clone and configure environment

```bash
git clone https://github.com/your-org/loan-wizard.git
cd loan-wizard
cp .env.example .env
# Fill in all values in .env
```

### Step 2 — Start Docker infrastructure

```bash
cd infra
docker compose up
```

This starts DynamoDB Local (port 8001), PostgreSQL (port 5432), and LocalStack S3+SQS (port 4566).

### Step 3 — Set up backend

```bash
cd backend

# Web backend venv
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows
source venv/bin/activate           # Mac/Linux
pip install -r requirements.txt

# ML venv (separate — avoids TensorFlow conflicts)
cd ml
python -m venv venv-ml
.\venv-ml\Scripts\Activate.ps1     # Windows
source venv-ml/bin/activate        # Mac/Linux
pip install -r requirements.txt
```

### Step 4 — Create DynamoDB tables and seed admin

```bash
cd backend
.\venv\Scripts\Activate.ps1
python infra/create_tables.py
python infra/seed_admin.py
```

### Step 5 — Start FastAPI

```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

### Step 6 — Start frontend

```bash
cd frontend
npm install
npm run dev
```

Customer app at `http://localhost:5173`
Admin dashboard at `http://localhost:5173/dashboard`

---

## Environment Variables

```env
# Groq LLM
GROQ_API_KEY=

# ipinfo (geo + VPN detection)
IPINFO_TOKEN=

# JWT
SECRET_KEY=

# DynamoDB Local
DYNAMO_ENDPOINT=http://localhost:8001
DYNAMO_REGION=ap-south-1

# PostgreSQL
POSTGRES_URL=postgresql://postgres:localdev@localhost:5432/loanwizard

# LocalStack (S3 + SQS)
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_DEFAULT_REGION=ap-south-1

# ML venv path
ML_PYTHON_PATH=C:\Users\rajal\Loan-Wizard\backend\ml\venv-ml\Scripts\python.exe

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Whisper model size
WHISPER_MODEL_SIZE=base
```

---

## API Endpoints

### Session (public — customer flow)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/session/start` | Create session + Daily.co room |
| POST | `/api/v1/session/{id}/update-geo` | Write geo capture event |
| POST | `/api/v1/session/{id}/upload-url` | Generate S3 presigned URL |
| POST | `/api/v1/session/{id}/confirm` | HITL form confirmation |
| POST | `/api/v1/session/{id}/consent` | Digital consent + trigger email |
| GET | `/api/v1/session/{id}/status` | Session status |

### Offer (public — customer flow)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/offer/generate` | Risk score + fraud check + 3 offers |

### Webhooks (internal — Lambda callbacks)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/webhook/stt-complete` | Whisper transcript result |
| POST | `/api/v1/webhook/cv-complete` | DeepFace analysis result |
| POST | `/api/v1/webhook/ocr-complete` | Textract extraction result |

### Dashboard (protected — admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard/sessions` | Paginated session list |
| GET | `/api/v1/dashboard/session/{id}` | Full session detail |
| GET | `/api/v1/audit/{id}` | Complete audit trail |
| GET | `/api/v1/audit/{id}/consent` | Consent record only |

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Admin login → JWT |
| POST | `/api/v1/auth/send-temp-password` | Generate + email temp password |
| POST | `/api/v1/auth/change-password` | Temp → permanent password |

---

## Fraud Detection System

Nine signals computed per session. Each contributes to a cumulative fraud score (0–100). Score is independent of credit risk band.

| Signal | Trigger | Score |
|---|---|---|
| Geo mismatch | IP city differs from declared city | +25 |
| VPN/Proxy detected | ipinfo privacy fields | +20 |
| Foreign IP | Country outside India | Hard block |
| Age mismatch | DeepFace estimate vs declared >5 years | +30 |
| Liveness failure | Face not detected as live | +40 |
| Doc vs speech mismatch | Textract name/DOB vs STT transcript | +35 |
| Income anomaly | Declared income >95th percentile for occupation | +20 |
| HITL over-correction | Customer corrects income >40% upward | +30 |
| Intent inconsistency | LLM flags vague or contradictory purpose | +10 |

**Score bands:**
- 0–20: Clean → Auto proceed
- 21–45: Low risk → Proceed with logging
- 46–70: Medium risk → Human review required
- 71–100: High risk → Session blocked

---

## Decision Engine

Risk band × fraud score produces one of four outcomes:

| | Fraud 0–45 | Fraud 46–70 | Fraud 71–100 |
|---|---|---|---|
| **Risk Band A/B** | AUTO_APPROVE | HUMAN_REVIEW | BLOCK |
| **Risk Band C** | HUMAN_REVIEW | HUMAN_REVIEW | BLOCK |
| **Risk Band D** | DECLINE | BLOCK | BLOCK |

---

## Compliance Architecture

| Requirement | Implementation |
|---|---|
| RBI V-CIP explicit consent | Consent screen before session start, written to audit log |
| RBI V-CIP geo-tagging | ipinfo.io on session join, country validation, stored in audit |
| RBI V-CIP document capture | S3 upload + Textract OCR on Aadhaar/PAN |
| RBI Digital Lending Directions 2025 | Data minimisation, no device resource access, audit trail |
| DPDP Act 2023 | Explicit consent declaration, purpose limitation, breach logging |
| PMLA | High fraud score sessions flagged for manual review |

---

## Phase 2 — AWS Migration Plan

The local environment is a direct mirror of the target AWS architecture. Migration requires only endpoint URL changes in environment variables.

### Migration steps

**Step 1 — DynamoDB**
```python
# Change in backend/app/adapters/dynamo.py
# From:
endpoint_url="http://localhost:8001"
# To:
endpoint_url=None  # uses real AWS
```

**Step 2 — S3 and SQS**
```python
# Change in backend/app/adapters/s3.py and sqs.py
# From:
endpoint_url="http://localhost:4566"
# To:
endpoint_url=None  # uses real AWS
```

**Step 3 — Deploy FastAPI**
```bash
# Railway or EC2 t2.micro
railway up
# or
scp -r backend/ ec2-user@your-ec2:/app
```

**Step 4 — Deploy Lambda functions**
```bash
# Package each lambda and deploy
cd lambdas/stt
zip -r function.zip .
aws lambda create-function --function-name loan-wizard-stt ...
```

**Step 5 — Configure Step Functions**
```bash
aws stepfunctions create-state-machine \
  --name loan-wizard-flow \
  --definition file://infra/step_functions.json
```

**Step 6 — Frontend deployment**
```bash
cd frontend
vercel --prod
```

### AWS services required for production

| Service | Purpose | Free tier |
|---|---|---|
| DynamoDB | Sessions, audit, users | 25GB free |
| S3 | Video, documents, frames | 5GB free |
| SQS | Async fan-out queue | 1M requests free |
| Lambda | STT, CV, OCR, summariser | 1M calls free |
| Step Functions | Session orchestration | 4,000 transitions free |
| RDS PostgreSQL | Loan apps, policy configs | 20GB free |
| CloudWatch | Logs, audit trail | 5GB free |
| API Gateway | HTTPS, JWT auth, WAF | 1M calls free |
| Textract | Document OCR | 1,000 pages free |

---

## Admin Access

Admin credentials are provisioned by running the seed script. No self-registration is permitted.

```bash
cd backend
.\venv\Scripts\Activate.ps1
python infra/seed_admin.py
```

Default credentials (change immediately in production):
- `admin@loanwizard.com` / `Admin@2026`
- `reviewer@poonawalla.com` / `Review@2026`

---

## XGBoost Model

Trained on the Home Credit Default Risk dataset (Kaggle).

| Metric | Value |
|---|---|
| Training samples | 307,511 |
| Features used | 12 |
| Validation AUC | 0.7497 |
| Model size | ~2MB |
| Inference time | <100ms |

Risk band mapping:
- Band A: default probability 0–10%
- Band B: 10–25%
- Band C: 25–45%
- Band D: 45%+

To retrain:
```bash
cd backend
.\ml\venv-ml\Scripts\python.exe ml\train.py
```

---

## Team

| Member | Role |
|---|---|
| Riyansh Kumar | Video pipeline — WebRTC, STT Lambda, CV Lambda, OCR Lambda, HITL screen |
| Alok Raj | Backend and intelligence — FastAPI, XGBoost, Groq LLM, fraud engine, DynamoDB |
| Pranay Gupta | Product and delivery — architecture, design system, demo preparation |

VIT Bhopal University · B.Tech Computer Science and Engineering
