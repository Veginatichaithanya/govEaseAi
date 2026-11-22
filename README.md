# GovEaseAI — AI-Powered Government Service Automation Platform

GovEaseAI is an AI-assisted digital governance platform designed to streamline citizen-to-government interactions. It automates eligibility verification, application processing, multimodal document analysis, auto-filling, and administrative oversight.

---

## 🏛️ Platform Architecture

GovEaseAI comprises three major subsystems:

1. **Citizen Portal (`/Frontend`)**:
   - Modern, responsive citizen experience built with React 19, TypeScript, and Vite.
   - Comprehensive government service catalog (Trade License, Shop Registration, Building Permission, Factory Registration, Pollution Certificate, Business License).
   - Multi-step interactive application wizard with live document upload, preview, and AI pre-verification.
   - Dedicated AI Guidance Assistant with contextual service insights.
   - Real-time application tracking with interactive stage progression.

2. **Government Officer Portal**:
   - Role-based officer login and review dashboard.
   - Application queue management (Pending, Under Review, Corrections Required, Approved, Rejected).
   - Side-by-side AI document verification comparison (Application Data vs. Extracted Document Data with confidence scores).
   - Officer action workflows: Approve, Request Corrections with Remarks, or Reject with Reason.
   - Digital approval generation.

3. **Backend Service (`/Backend`)**:
   - FastAPI high-performance asynchronous API backed by PostgreSQL and SQLAlchemy ORM.
   - Multimodal AI processing pipeline integration (AgentRouter & OpenRouter).
   - Document field extraction, validation, cross-document comparison, and verification engine.
   - Secure authentication and audit logging.

---

## 🚀 Key Features

- **Multimodal AI Document Processing**: Extracts structured fields (Applicant Name, ID numbers, addresses, registration dates) from uploaded files.
- **AI Document Verification**: Matches form entries with extracted document data to flag discrepancies and guide officers with confidence ratings.
- **AI Auto-Fill**: Intelligently pre-fills citizen application forms while keeping all fields user-editable.
- **Strict Human Oversight**: AI acts strictly as an assistive tool; final decisions and approvals are exclusively executed by authorized officers.
- **End-to-End Application Lifecycle**: Complete status tracking (`DRAFT` → `SUBMITTED` → `AI_PROCESSING` → `OFFICER_REVIEW` → `CORRECTION_REQUIRED` / `APPROVED` → `DIGITAL_APPROVAL`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind-compatible CSS design system, Lucide React icons, OGL WebGL animations.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Alembic, Psycopg 3, Pydantic v2.
- **Database**: PostgreSQL.
- **AI Integration**: OpenRouter / AgentRouter (DeepSeek, Gemini).

---

## 📦 Getting Started

### 1. Repository Setup
```bash
git clone https://github.com/Veginatichaithanya/govEaseAi.git
cd govEaseAi
```

### 2. Backend Setup
```bash
cd Backend
# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run migrations (if using PostgreSQL)
alembic upgrade head

# Start FastAPI server
npm run dev
# or: uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

### 3. Frontend Setup
```bash
cd ../Frontend
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📄 License

This project is licensed under the MIT License.
