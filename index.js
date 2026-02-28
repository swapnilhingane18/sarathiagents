// ============================================================
//  SARATHI LOAN CHATBOT — MULTI-AGENT BACKEND
//  Stack: Node.js + Express + Gemini AI
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ADDED FOR HACKATHON — security middlewares
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================================
//  STARTUP — ENV VARIABLE VALIDATION
//  Why needed: If GEMINI_API_KEY is missing, all AI calls will
//  silently fail. Crashing early saves hours of debugging.
//  What to change later: Add all required secrets here.
// ============================================================
if (!process.env.GEMINI_API_KEY) {
    console.error('❌  FATAL: GEMINI_API_KEY is not set in your .env file.');
    console.error('    Copy .env.example → .env and fill in your key.');
    process.exit(1);
}

// ADDED FOR HACKATHON — Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ============================================================
//  APP SETUP
// ============================================================
const app = express();

// ADDED FOR HACKATHON — Helmet sets secure HTTP headers (prevents
// clickjacking, XSS, MIME sniffing). Mandatory in banking apps.
app.use(helmet());

// ADDED FOR HACKATHON — Restrict CORS to only your UI origin.
// Why needed: Prevents other websites from calling your API.
// What to change later: Replace with your deployed frontend URL.
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));

// ADDED FOR HACKATHON — Rate limiting: max 20 requests / minute
// Why needed: Prevents brute-force attacks and API abuse.
// What to change later: Lower the limit in production (e.g., 10/min).
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many requests. Please wait a minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());

// ============================================================
//  COMPLIANCE LOGGER
//  What it does: Appends every approval/rejection to a log file.
//  Why needed in banking: RBI mandates audit trails for all
//  loan decisions. This is your evidence in case of disputes.
//  What to change later: Replace with a proper DB (MongoDB/Postgres).
// ============================================================
const COMPLIANCE_LOG = path.join(__dirname, 'compliance.log');

function complianceLog(name, panNumber, decision, reason = '') {  // ADDED FOR HACKATHON
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] | Name: ${name} | PAN: ${panNumber} | Decision: ${decision}${reason ? ' | Reason: ' + reason : ''}\n`;
    fs.appendFileSync(COMPLIANCE_LOG, entry, 'utf8');
}

// ============================================================
//  HELPER FUNCTIONS
// ============================================================

// ADDED FOR HACKATHON — EMI Calculation (standard banking formula)
// Why needed: Banks must show customers their monthly obligation.
// What to change later: Dynamic interest rates from a rate-card DB.
function calculateEMI(principal, annualRatePercent, months) {
    const r = annualRatePercent / 100 / 12;  // monthly interest rate
    // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    return Math.round(emi);
}

// ADDED FOR HACKATHON — Risk Score (0–100, lower = safer)
// Why needed: A single number that summarizes borrower risk.
// What to change later: Train an ML model on historical loan data.
function calculateRiskScore(userData) {
    let score = 0;
    if (userData.creditScore >= 750) score += 10;
    else if (userData.creditScore >= 700) score += 25;
    else if (userData.creditScore >= 650) score += 40;
    else score += 70;

    const loanToSalaryRatio = userData.loanAmount / (userData.monthlySalary * 12);
    if (loanToSalaryRatio > 5) score += 30;
    else if (loanToSalaryRatio > 3) score += 15;
    else score += 5;

    if (userData.age < 30 || userData.age > 55) score += 10;
    return Math.min(score, 100);
}

// ADDED FOR HACKATHON — Credit Score Placeholder
// Why needed: Real apps fetch the score from CIBIL/Experian using PAN.
// TODO CIBIL: Replace this with: POST https://api.cibil.com/score { pan: panNumber }
// TODO CIBIL: Add API key to .env as CIBIL_API_KEY
async function fetchCreditScore(panNumber) {
    console.log(`[Credit API] Fetching score for PAN: ${panNumber} — using placeholder`);
    // Returning user-provided score for now. Replace with real API call.
    return null; // null = use the score from userData
}

// ============================================================
//  GEMINI AI — Natural Language Parsing
//  What it does: Reads a free-text user message and extracts
//  structured loan application data automatically.
//  Why needed: Users won't fill forms — they'll type messages.
//  What to change later: Add conversation history for multi-turn chat.
// ============================================================
async function parseUserMessage(message) {  // ADDED FOR HACKATHON
    const prompt = `
You are a banking assistant for SARATHI Loan. Extract the following fields from the user's message and return ONLY valid JSON. If a field is not mentioned, return null for that field.

Fields to extract:
- name (string)
- age (number)
- loanAmount (number, in INR)
- purpose (string, e.g. "home renovation", "education")
- monthlySalary (number, in INR)
- creditScore (number, 300-900)
- panNumber (string, format ABCDE1234F)
- aadhaarNumber (string, 12 digits)
- district (string)
- state (string)

User message: "${message}"

Return ONLY this JSON format, no markdown, no explanation:
{"name":null,"age":null,"loanAmount":null,"purpose":null,"monthlySalary":null,"creditScore":null,"panNumber":null,"aadhaarNumber":null,"district":null,"state":null}
`;

    const result = await geminiModel.generateContent(prompt);
    const rawText = result.response.text().trim();

    // ADDED FOR HACKATHON — Safe JSON parse with fallback
    // Why needed: Gemini sometimes wraps JSON in markdown code blocks.
    // This strips those before parsing.
    try {
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('[Gemini Parse Error] Could not parse AI response:', rawText);
        throw new Error('AI returned invalid JSON. Please try again.');
    }
}

// ============================================================
//  INPUT SANITISER
//  Why needed: Raw user input must never be trusted directly.
//  What to change later: Use a library like DOMPurify for richer sanitization.
// ============================================================
function sanitizeInput(data) {  // ADDED FOR HACKATHON
    const clean = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            clean[key] = value.trim().replace(/<[^>]*>/g, ''); // strip HTML tags
        } else if (typeof value === 'number') {
            clean[key] = value;
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

// ============================================================
//  INPUT VALIDATOR
//  Why needed: Prevents garbage data from reaching banking logic.
// ============================================================
function validateInput(data) {  // ADDED FOR HACKATHON
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '')
        errors.push('name is required and must be a non-empty string.');
    if (!data.loanAmount || typeof data.loanAmount !== 'number' || data.loanAmount <= 0)
        errors.push('loanAmount must be a positive number.');
    if (!data.monthlySalary || typeof data.monthlySalary !== 'number' || data.monthlySalary <= 0)
        errors.push('monthlySalary must be a positive number.');
    if (data.age === undefined || data.age < 18 || data.age > 80)
        errors.push('age must be between 18 and 80.');
    if (data.creditScore === undefined || data.creditScore < 300 || data.creditScore > 900)
        errors.push('creditScore must be between 300 and 900.');
    return errors;
}

// ============================================================
//  AGENT 1 — SALES AGENT
//  What it does: Validates that the customer has shared all
//  required loan intent fields (amount and purpose).
//  Why needed: Ensures no loan is processed without a stated
//  purpose — regulatory requirement.
//  What to change later: Use Gemini to upsell the right loan product.
// ============================================================
function salesAgent(userData) {
    console.log('[Sales Agent] Analyzing requirements...');
    if (!userData.loanAmount || !userData.purpose) {
        return { status: 'REJECTED', reason: 'Missing loan amount or purpose.' };
    }
    return { status: 'APPROVED', data: userData };
}

// ============================================================
//  AGENT 2 — VERIFICATION AGENT
//  What it does: Checks age band (21–60) and credit score (≥650).
//  Why needed: RBI guidelines restrict lending to minors and
//  high-risk borrowers. CIBIL score < 650 = high default risk.
//  What to change later: Integrate real bureau API via fetchCreditScore().
// ============================================================
function verificationAgent(userData) {
    console.log('[Verification Agent] Checking age and credit score...');
    if (userData.age < 21 || userData.age > 60) {
        return { status: 'REJECTED', reason: `Age ${userData.age} is outside the allowed 21–60 range.` };
    }
    if (userData.creditScore < 650) {
        return { status: 'REJECTED', reason: `Credit score ${userData.creditScore} is below minimum (650).` };
    }
    return { status: 'APPROVED' };
}

// ============================================================
//  AGENT 3 — KYC AGENT
//  What it does: Validates PAN format and flags missing Aadhaar.
//  Why needed: PMLA Act requires KYC verification before any loan.
//  Fake PAN = fraud attempt = reject immediately.
//  What to change later: Call NSDL/UIDAI APIs for live verification.
// ============================================================
function kycAgent(userData) {
    console.log('[KYC Agent] Verifying KYC documents...');

    // PAN validation (format: ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!userData.panNumber || !panRegex.test(userData.panNumber)) {
        return { status: 'REJECTED', reason: 'Invalid or missing PAN Card. Suspected fake KYC.' };
    }

    // ADDED FOR HACKATHON — Aadhaar placeholder
    // TODO UIDAI: Replace with POST https://api.uidai.gov.in/verify { aadhaar: aadhaarNumber }
    // TODO UIDAI: Add UIDAI_API_KEY to .env
    if (!userData.aadhaarNumber) {
        console.warn('[KYC Agent] ⚠ Aadhaar number not provided — skipping UIDAI check (placeholder).');
    } else if (!/^\d{12}$/.test(userData.aadhaarNumber)) {
        return { status: 'REJECTED', reason: 'Aadhaar number must be exactly 12 digits.' };
    }

    return { status: 'APPROVED' };
}

// ============================================================
//  AGENT 4 — UNDERWRITING AGENT
//  What it does: Checks repayment capacity — loan must not exceed
//  10× monthly salary. Also computes EMI and risk score.
//  Why needed: Prevents over-lending, which causes NPAs for banks.
//  What to change later: Use ML model for probability of default.
// ============================================================
function underwritingAgent(userData) {
    console.log('[Underwriting Agent] Evaluating repayment capacity...');

    const maxAllowedLoan = userData.monthlySalary * 10 * 12; // annual income × 10
    if (userData.loanAmount > maxAllowedLoan) {
        return { status: 'REJECTED', reason: `Loan ₹${userData.loanAmount} exceeds max allowed ₹${maxAllowedLoan} for your salary.` };
    }

    // ADDED FOR HACKATHON — compute risk metrics
    const emi = calculateEMI(userData.loanAmount, 10.5, 36);
    const risk = calculateRiskScore(userData);

    return { status: 'APPROVED', emi, risk };
}

// ============================================================
//  AGENT 5 — SANCTION AGENT
//  What it does: Generates official sanction letter text.
//  Why needed: The sanction letter is a legally binding offer.
//  It states the terms the borrower must agree to.
//  What to change later: Use PDFKit to generate a signed PDF,
//  then email via Nodemailer/SendGrid.
// ============================================================
function sanctionAgent(userData, emi, risk) {
    console.log('[Sanction Agent] Generating Sanction Letter...');

    const letter = `
========================================================
              SARATHI BANK — LOAN SANCTION LETTER
========================================================
Dear ${userData.name},

We are pleased to sanction your loan application.

  Applicant        : ${userData.name}
  District / State : ${userData.district || 'N/A'} / ${userData.state || 'N/A'}
  Loan Purpose     : ${userData.purpose}

  Approved Amount  : ₹${userData.loanAmount.toLocaleString('en-IN')}
  Interest Rate    : 10.5% p.a. (reducing balance)
  Tenure           : 36 Months
  Monthly EMI      : ₹${emi.toLocaleString('en-IN')}
  Risk Score       : ${risk}/100 (lower = safer)

Terms: Disbursement within 3 working days upon document
submission. Standard SARATHI terms and conditions apply.

========================================================`;

    return { status: 'COMPLETED', letter };
}

// ============================================================
//  MASTER AGENT — ORCHESTRATOR
//  What it does: Routes request through all agents in order.
//  If any agent rejects, the chain stops immediately.
//  Why needed: Central control prevents partial processing.
//  What to change later: Use LangChain or AutoGen for autonomous routing.
// ============================================================
async function masterAgent(userData) {
    console.log('\n[Master Agent] New loan request received. Orchestrating workflow...');

    const step1 = salesAgent(userData);
    if (step1.status === 'REJECTED') return step1;

    const step2 = verificationAgent(userData);
    if (step2.status === 'REJECTED') return step2;

    const step3 = kycAgent(userData);
    if (step3.status === 'REJECTED') return step3;

    const step4 = underwritingAgent(userData);
    if (step4.status === 'REJECTED') return step4;

    const step5 = sanctionAgent(userData, step4.emi, step4.risk);
    return step5;
}

// ============================================================
//  REST API ROUTES
// ============================================================

// Health check (GET /)
// Why needed: Used by deployment platforms (Railway, Render) to
// confirm the app is alive before routing traffic.
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'SARATHI Multi-Agent Backend', timestamp: new Date().toISOString() });
});

// ADDED FOR HACKATHON — /api/health for explicit monitoring
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Main chat route — MADE ASYNC for Gemini AI
app.post('/api/chat', async (req, res) => {  // ADDED async — HACKATHON
    try {
        let userData = req.body;

        // If the user sends a free-text message, parse it with Gemini
        // ADDED FOR HACKATHON — NLP entry point
        if (userData.message && typeof userData.message === 'string') {
            console.log('[Master Agent] Free-text message detected — routing to Gemini...');
            const parsed = await parseUserMessage(userData.message); // await Gemini
            // Merge parsed AI fields into userData (user-supplied fields take priority)
            userData = { ...parsed, ...userData };
            delete userData.message;
        }

        // Sanitize all string inputs — ADDED FOR HACKATHON
        userData = sanitizeInput(userData);

        // Validate required fields — ADDED FOR HACKATHON
        const validationErrors = validateInput(userData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
        }

        // Optional: fetch real credit score (placeholder returns null) — ADDED FOR HACKATHON
        const fetchedScore = await fetchCreditScore(userData.panNumber);
        if (fetchedScore !== null) userData.creditScore = fetchedScore;

        // Run the multi-agent pipeline
        const finalDecision = await masterAgent(userData);

        // Compliance logging — ADDED FOR HACKATHON
        complianceLog(userData.name, userData.panNumber || 'N/A', finalDecision.status, finalDecision.reason || '');

        if (finalDecision.status === 'COMPLETED') {
            return res.status(200).json({ success: true, message: 'Loan Approved!', sanctionLetter: finalDecision.letter });
        } else {
            return res.status(200).json({ success: false, message: 'Loan Rejected', reason: finalDecision.reason });
        }

    } catch (error) {
        console.error('[System Error]', error.message);
        res.status(500).json({ success: false, message: error.message || 'Server error occurred.' });
    }
});

// ============================================================
//  START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 SARATHI Backend running at http://localhost:${PORT}`);
    console.log(`   POST /api/chat → Loan pipeline`);
    console.log(`   GET  /api/health → Health check`);
});

module.exports = app; // Export for Jest/Supertest testing
