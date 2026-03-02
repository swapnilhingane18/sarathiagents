# SARATHI — AI-Powered Loan Multi-Agent Chatbot Backend

> A production-ready, multi-agent loan processing backend built with **Node.js**, **Express**, and **Google Gemini AI**. Developed as part of a hackathon project to demonstrate how AI agents can automate the end-to-end loan approval pipeline in the banking sector.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-orange)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-ISC-lightgrey)](./LICENSE)

---

## 📌 Project Description

**SARATHI** (meaning *guide* in Hindi) is a loan chatbot backend that uses six coordinated AI agents to process a loan application from raw user input all the way to a formal sanction letter — completely automatically.

The user can either:
1. **Fill a structured form** → sends a JSON body to the API
2. **Type a free-text message** → Gemini AI extracts all fields automatically

The Master Agent then routes the application through the Sales → Verification → KYC → Underwriting → Sanction pipeline, stopping at the first failure and logging every decision for compliance.

---

## 🏗 Architecture

```
User / Frontend UI
        │
        ▼
┌───────────────────────────────┐
│     POST /api/chat            │  ← Express REST API
│     (Rate limited, Helmeted)  │
└───────────┬───────────────────┘
            │
     ┌──────▼──────┐
     │ MASTER AGENT│  ← Orchestrator — routes to each agent
     └──────┬──────┘
            │
     ┌──────▼──────────────────────────────────────────┐
     │  1. SALES AGENT        — Validates loan intent   │
     │  2. VERIFICATION AGENT — Age 21–60, Score ≥650   │
     │  3. KYC AGENT          — PAN + Aadhaar check     │
     │  4. UNDERWRITING AGENT — Salary vs Loan + EMI    │
     │  5. SANCTION AGENT     — Generates letter        │
     └─────────────────────────────────────────────────┘
            │
     ┌──────▼──────┐
     │ compliance  │  ← Every decision written to compliance.log
     │   .log      │
     └─────────────┘
```

---

## 🤖 Agent Descriptions

| # | Agent | Role | Banking Relevance |
|---|---|---|---|
| 1 | **Sales Agent** | Checks loan amount & purpose | RBI requires stated purpose |
| 2 | **Verification Agent** | Age 21–60, credit score ≥ 650 | Regulatory compliance |
| 3 | **KYC Agent** | PAN format + Aadhaar check | PMLA Act — AML compliance |
| 4 | **Underwriting Agent** | Salary × ratio + EMI + risk score | Prevents NPAs |
| 5 | **Sanction Agent** | Generates sanction letter text | Legally binding offer |
| 6 | **Master Agent** | Orchestrates all agents in sequence | Central control |

---

## ✨ Features

- **Gemini AI NLP** — Parse free-text loan requests automatically
- **Multi-Agent Pipeline** — Each agent is independent, testable, and reusable
- **EMI Calculator** — Standard reducing-balance formula
- **Risk Score Engine** — 0–100 score based on credit, salary, age
- **Compliance Logging** — Every approval/rejection written to `compliance.log`
- **Input Validation** — All fields type-checked before reaching agents
- **Input Sanitization** — HTML stripping on all string inputs
- **Helmet** — Secure HTTP headers
- **Rate Limiting** — 20 requests/minute per IP
- **CORS** — Restricted to configured frontend origin
- **Aadhaar Placeholder** — Ready for UIDAI API integration
- **Credit Score Placeholder** — Ready for CIBIL/Experian API
- **Jest + Supertest** — 7 automated test cases
- **Postman Collection** — 6 ready-to-import test requests
- **Docker Ready** — Node 18 Alpine Dockerfile included

---

## 📁 Project Structure

```
sarathiagents/
├── index.js                         # Main server — all 6 agents + REST API
├── tests/
│   └── agents.test.js               # Jest + Supertest — 7 test cases
├── sarathi.postman_collection.json  # Postman collection — import to test
├── compliance.log                   # Auto-created audit trail (gitignored)
├── .env                             # Your secrets — NOT committed
├── .env.example                     # Template — copy to .env
├── .gitignore                       # Excludes node_modules, .env, logs
├── Dockerfile                       # Node 18 Alpine container
├── README.md                        # This file
└── package.json                     # Dependencies + test script
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ installed
- Free Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

### 1. Clone the repo
```bash
git clone https://github.com/swapnilhingane18/sarathiagents.git
cd sarathiagents
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
copy .env.example .env
```
Open `.env` and replace `your_gemini_api_key_here` with your real Gemini key.

### 4. Start the server
```bash
npm start
```
Server runs at `http://localhost:5000`

---

## 📡 API Reference

### `GET /`
Health check — returns server status.

```json
{ "status": "ok", "service": "SARATHI Multi-Agent Backend", "timestamp": "..." }
```

### `POST /api/chat`

**Option A — Structured JSON (direct form submission):**
```json
{
  "name": "Swapnil Hingane",
  "age": 28,
  "loanAmount": 300000,
  "purpose": "Home Renovation",
  "monthlySalary": 60000,
  "creditScore": 720,
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "123456789012",
  "district": "Pune",
  "state": "Maharashtra"
}
```

**Option B — Free text (Gemini parses it):**
```json
{
  "message": "Hi I am Swapnil, 28 years old. I want a 3 lakh loan for home renovation. My salary is 60000, PAN is ABCDE1234F, credit score 720."
}
```

**Approved Response:**
```json
{
  "success": true,
  "message": "Loan Approved!",
  "sanctionLetter": "======= SARATHI BANK — LOAN SANCTION LETTER ======= ..."
}
```

**Rejected Response:**
```json
{
  "success": false,
  "message": "Loan Rejected",
  "reason": "Credit score 580 is below minimum (650)."
}
```

---

## 🧪 Testing

```bash
npm test
```

**Test Coverage:**

| Test | Scenario | Expected |
|---|---|---|
| TC01 | Valid applicant | ✅ Approved + sanction letter |
| TC02 | Age 17 (below 18) | ❌ 400 Validation error |
| TC03 | Credit score 580 | ❌ Rejected by Verification Agent |
| TC04 | Fake PAN `FAKEPAN123` | ❌ Rejected by KYC Agent |
| TC05 | Loan ₹10 crore on ₹60k salary | ❌ Rejected by Underwriting Agent |
| TC06 | GET health check | ✅ `{ status: "ok" }` |
| TC07 | Missing name + loanAmount | ❌ 400 with error list |

---

## 🔒 Security

| Feature | Library | Purpose |
|---|---|---|
| Secure headers | `helmet` | Prevents XSS, clickjacking, MIME sniffing |
| Rate limiting | `express-rate-limit` | Max 20 req/min per IP |
| CORS | `cors` | Only allows configured frontend origin |
| Input sanitization | Custom | Strips HTML tags from all string inputs |
| Input validation | Custom | Type-checks all required fields |

---

## 📸 Screenshots

> _Add screenshots of your frontend UI here once connected._

```
Coming soon — frontend integration with React/HTML UI
```

---

## 🔮 Future Improvements

| Feature | Description |
|---|---|
| **Live CIBIL API** | Replace placeholder with real credit bureau API |
| **UIDAI Aadhaar Verify** | Replace placeholder with government API |
| **PDF Sanction Letter** | Generate signed PDF using PDFKit |
| **Email Delivery** | Send sanction letter via Nodemailer/SendGrid |
| **MongoDB Storage** | Save all applications to a database |
| **Multi-turn Chat** | Add conversation history for follow-up questions |
| **LangChain Agents** | Replace manual pipeline with LangChain AgentExecutor |
| **Dashboard** | Admin panel to view all applications and compliance logs |

---

## 🐳 Docker

```bash
docker build -t sarathi-backend .
docker run -p 5000:5000 --env-file .env sarathi-backend
```

---

## 👨‍💻 Author

**Swapnil Hingane**  
Final Year Engineering Student  
GitHub: [@swapnilhingane18](https://github.com/swapnilhingane18)

---

## 📄 License

ISC License — Free to use for educational and hackathon purposes.
