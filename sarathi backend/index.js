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
const geminiModel = genAI.getGenerativeModel({
    model: 'models/gemini-1.5-flash'
});

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
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: false
}));

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

// ADDED FOR HACKATHON — FOIR (Fixed Obligation to Income Ratio) logic
// Why banks use this: Real underwriting is based on EMI affordability.
// We assume the user can comfortably spend up to 40% of their salary on an EMI.
// We reverse-calculate the max loan from that max affordable EMI using the
// benchmark Home Loan terms (8.5%, 240 months). Finally, the credit score 
// acts as a risk multiplier on the approved amount limit.
function calculateMaxEligibleLoan(monthlySalary, creditScore) {
    // 1. Max affordable EMI is 40% of monthly income
    const maxEMI = monthlySalary * 0.4;

    // 2. Reverse calculate principal using 8.5% for 240 months
    const r = 8.5 / 100 / 12;
    const months = 240;
    // P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    const baseAmount = maxEMI * (Math.pow(1 + r, months) - 1) / (r * Math.pow(1 + r, months));

    // 3. Apply credit score multipliers
    let multiplier = 1.0;
    if (creditScore >= 750) multiplier = 1.0;
    else if (creditScore >= 700) multiplier = 0.85;
    else if (creditScore >= 650) multiplier = 0.70;
    else return 0; // Rejected — high risk

    return Math.floor(baseAmount * multiplier);
}

// ADDED FOR HACKATHON — Salary Simulation
// Shows customer how improving salary increases loan eligibility.
function simulateBetterLoan(salary, creditScore) {
    const salaries = [
        Math.round(salary * 1.2),
        Math.round(salary * 1.5)
    ];

    return salaries.map(s => {
        const maxLoan = calculateMaxEligibleLoan(s, creditScore);
        return {
            salary: s,
            possibleLoan: maxLoan
        };
    });
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
    // loanAmount is now OPTIONAL — if absent, system will suggest maximum eligible amount
    if (data.loanAmount !== undefined && data.loanAmount !== null) {
        if (typeof data.loanAmount !== 'number' || data.loanAmount <= 0)
            errors.push('loanAmount, if provided, must be a positive number.');
    }
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

    // If loanAmount is not provided, compute the maximum the user can take
    if (!userData.loanAmount) {
        const maxLoan = calculateMaxEligibleLoan(userData.monthlySalary, userData.creditScore);
        userData.loanAmount = maxLoan;     // set into userData so pipeline continues
        userData._autoLoanAmount = true;   // flag so API can tell the user this was computed
        console.log(`[Sales Agent] No loan amount provided — suggesting max eligible: ₹${maxLoan.toLocaleString('en-IN')} (FOIR logic)`);
    }

    if (!userData.purpose) {
        return { status: 'REJECTED', reason: 'Missing loan purpose. Please tell us why you need the loan.' };
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

    // Underwriting uses FOIR and Credit score to determine max eligibility
    const maxAllowedLoan = calculateMaxEligibleLoan(userData.monthlySalary, userData.creditScore);

    if (userData.loanAmount > maxAllowedLoan) {
        // UPDATED: human-friendly rejection — tells user exactly what they CAN take
        return {
            status: 'REJECTED',
            reason: `Your requested loan amount ₹${userData.loanAmount.toLocaleString('en-IN')} is too high. Based on your monthly salary of ₹${userData.monthlySalary.toLocaleString('en-IN')}, you are eligible for a maximum loan of ₹${maxAllowedLoan.toLocaleString('en-IN')}. Please reapply with a lower amount.`,
            maxAllowedLoan,  // expose for frontend display
        };
    }

    // ADDED FOR HACKATHON — compute risk metrics
    const emi = calculateEMI(userData.loanAmount, 10.5, 36);
    const risk = calculateRiskScore(userData);

    return { status: 'APPROVED', emi, risk, maxAllowedLoan };
}

// ============================================================
//  AGENT 5 — SANCTION AGENT
//  What it does: Generates official sanction letter text.
//  Why needed: The sanction letter is a legally binding offer.
//  It states the terms the borrower must agree to.
//
//  UPDATED: Now accepts bestLoanDetails from LoanAdvisorAgent
//  so the letter always matches the recommended product.
//
//  What to change later: Use PDFKit to generate a signed PDF,
//  then email via Nodemailer/SendGrid.
// ============================================================
function sanctionAgent(userData, bestLoanDetails, risk) {
    // UPDATED — now uses bestLoan terms, not hardcoded values
    console.log('[Sanction Agent] Using best loan terms for sanction letter...');

    // Re-calculate EMI using bestLoan's rate and tenure for full accuracy
    // Why: LoanAdvisor already computed this, but we recalculate here to
    // guarantee the sanction letter is self-consistent.
    const emi = calculateEMI(
        userData.loanAmount,
        bestLoanDetails.interestRate,
        bestLoanDetails.tenureMonths
    );

    const letter = `
========================================================
              SARATHI BANK — LOAN SANCTION LETTER
========================================================
Dear ${userData.name},

We are pleased to sanction your loan application.

  Applicant        : ${userData.name}
  District / State : ${userData.district || 'N/A'} / ${userData.state || 'N/A'}
  Loan Purpose     : ${userData.purpose}
  Loan Product     : ${bestLoanDetails.name}

  Approved Amount  : ₹${userData.loanAmount.toLocaleString('en-IN')}
  Interest Rate    : ${bestLoanDetails.interestRate}% p.a. (reducing balance)
  Tenure           : ${bestLoanDetails.tenureMonths} Months
  Monthly EMI      : ₹${emi.toLocaleString('en-IN')}
  Risk Score       : ${risk}/100 (lower = safer)

Terms: Disbursement within 3 working days upon document
submission. Standard SARATHI terms and conditions apply.

========================================================`;

    return { status: 'COMPLETED', letter, emi };
}

// ============================================================
//  AGENT 6 — LOAN ADVISOR AGENT
//  What it does: Checks which loan products the applicant
//  qualifies for based on salary, credit score, and age.
//  Then recommends the BEST loan and calculates its EMI.
//  If not eligible for anything, gives actionable tips.
//
//  Why banks use this logic:
//  Real banks have a product catalogue. Each product has
//  its own eligibility rules. Rather than just rejecting,
//  a good system tells the customer WHAT they can get and
//  HOW to improve their profile. This reduces churn and
//  builds customer trust.
//
//  What to change later:
//  - Pull loan products from a database (MongoDB/Postgres)
//  - Add loan-specific interest rates per product
//  - Add income proof verification per loan type
//  - Run this FIRST (pre-screening) not after underwriting
// ============================================================
function loanAdvisorAgent(userData) {  // ADDED FOR HACKATHON
    console.log('[Loan Advisor Agent] Checking loan eligibility...');

    // --- Loan Product Catalogue ---
    // Each loan has its own eligibility rules.
    // In production, this array would come from a database.
    const loanProducts = [
        {
            name: 'Personal Loan',
            minAmount: 50000,   // banks don't issue personal loans below ₹50,000
            minSalary: 20000,
            minCreditScore: 650,
            maxAge: null,
            interestRate: 14,
            tenureMonths: 36,
        },
        {
            name: 'Home Loan',
            minAmount: 500000,  // housing loan ticket size starts at ₹5,00,000
            minSalary: 50000,
            minCreditScore: 700,
            maxAge: null,
            interestRate: 8.5,
            tenureMonths: 240,
        },
        {
            name: 'Education Loan',
            minAmount: 100000,  // covers at least one year of tuition
            minSalary: 0,
            minCreditScore: 0,
            maxAge: 35,
            interestRate: 9.0,
            tenureMonths: 84,
        },
        {
            name: 'Gold Loan',
            minAmount: 20000,   // minimum gold pledgeable value
            minSalary: 0,
            minCreditScore: 600,
            maxAge: null,
            interestRate: 10,
            tenureMonths: 12,
        },
    ];

    // --- Purpose Mapping ---
    // Why banks match loan purpose:
    // Banks must comply with RBI end-use guidelines. A Home Loan disbursed
    // for personal expenses is a regulatory violation. Purpose matching
    // ensures the loan product aligns with the borrower's stated need,
    // which also reduces fraud and misuse of funds.
    //
    // What to change later:
    // Move this map to a database so product managers can update keywords
    // without a code deployment. Consider multi-language keyword support.
    const purposeKeywords = {
        'Personal Loan': ['medical', 'travel', 'wedding', 'emergency', 'personal', 'other'],
        'Home Loan': ['home', 'house', 'renovation', 'property', 'construction'],
        'Education Loan': ['education', 'college', 'study', 'fees', 'course', 'degree'],
        'Gold Loan': null,  // null = allowed for ANY purpose (collateral-based loan)
    };

    // Normalise purpose to lowercase for case-insensitive matching
    const userPurpose = (userData.purpose || '').toLowerCase().trim();

    // --- Check eligibility for each product ---
    const eligibleLoans = [];
    const ineligibleReasons = {};

    for (const product of loanProducts) {
        const reasons = [];

        if (userData.loanAmount < product.minAmount)
            reasons.push(`loan amount ₹${userData.loanAmount.toLocaleString('en-IN')} is below the minimum required ₹${product.minAmount.toLocaleString('en-IN')} for ${product.name}`);

        if (userData.monthlySalary < product.minSalary)
            reasons.push(`salary ₹${userData.monthlySalary} below required ₹${product.minSalary}`);

        if (userData.creditScore < product.minCreditScore)
            reasons.push(`credit score ${userData.creditScore} below required ${product.minCreditScore}`);

        if (product.maxAge !== null && userData.age > product.maxAge)
            reasons.push(`age ${userData.age} exceeds maximum ${product.maxAge}`);

        // --- Purpose check ---
        // null keywords means the product accepts any purpose (e.g. Gold Loan)
        const allowedKeywords = purposeKeywords[product.name];
        if (allowedKeywords !== null) {
            const purposeMatches = allowedKeywords.some(kw => userPurpose.includes(kw));
            if (!purposeMatches) {
                reasons.push(`loan purpose "${userData.purpose}" does not match this product. ` +
                    `Accepted purposes: ${allowedKeywords.join(', ')}`);
            }
        }

        if (reasons.length === 0) {
            // Eligible — calculate EMI for this product
            const emi = calculateEMI(userData.loanAmount, product.interestRate, product.tenureMonths);
            eligibleLoans.push({ ...product, emi });
        } else {
            ineligibleReasons[product.name] = reasons;
        }
    }

    // --- Pick the BEST loan ---
    // Selection criteria (in order of priority):
    //  1. Lowest interest rate  → saves the most money over the loan lifetime
    //  2. Shortest tenure       → tie-breaker; shorter = less interest paid overall
    // Why changed from lowest EMI:
    //  Lowest EMI can mislead — a 20-year loan has a tiny EMI but costs far
    //  more in total interest. Lowest rate is the more honest recommendation.
    let bestLoan = null;
    let emiDetails = null;

    if (eligibleLoans.length > 0) {
        eligibleLoans.sort((a, b) => {
            if (a.interestRate !== b.interestRate) return a.interestRate - b.interestRate; // lowest rate first
            return a.tenureMonths - b.tenureMonths;                                         // shorter tenure as tie-breaker
        });
        bestLoan = eligibleLoans[0];
        emiDetails = {
            loanAmount: userData.loanAmount,
            interestRate: bestLoan.interestRate,
            tenureMonths: bestLoan.tenureMonths,
            emi: bestLoan.emi,
        };
    }

    // --- Improvement Tips ---
    // If the user is not eligible for any loan, give specific advice.
    // Why needed: Reducing rejections improves customer lifetime value.
    const improvementTips = [];

    if (ineligibleReasons['Personal Loan'] || ineligibleReasons['Gold Loan']) {
        if (userData.creditScore < 650)
            improvementTips.push('Pay all EMIs and credit card bills on time for 6 months to raise your credit score above 650.');
        if (userData.creditScore < 600)
            improvementTips.push('Reduce your existing loan burden. Multiple active loans lower your credit score.');
    }
    if (ineligibleReasons['Home Loan']) {
        if (userData.monthlySalary < 50000)
            improvementTips.push('For a Home Loan, add a co-applicant (spouse/parent) to combine incomes above ₹50,000/month.');
        if (userData.creditScore < 700)
            improvementTips.push('Improve credit score to at least 700 to qualify for a Home Loan.');
    }
    if (ineligibleReasons['Education Loan']) {
        if (userData.age > 35)
            improvementTips.push('Education Loan is available only up to age 35. Consider a Personal Loan instead.');
    }
    if (eligibleLoans.length === 0) {
        improvementTips.push('You are currently not eligible for any loan. Fix KYC issues (invalid PAN/Aadhaar) first.');
        improvementTips.push('Wait 3–6 months while improving credit score, then reapply.');
    }

    return {
        eligibleLoans: eligibleLoans.map(l => l.name),
        bestLoan: bestLoan ? bestLoan.name : null,
        emiDetails,
        improvementTips,
        ineligibleReasons,  // useful for debugging / frontend display
    };
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

    // Banks show EMI for approved amount, not rejected request.
    // If requested amount was higher than max allowed, cap it so
    // Loan Advisor (and potentially Sanction Agent if workflow changes)
    // calculations reflect reality.
    if (step4.maxAllowedLoan !== undefined && userData.loanAmount > step4.maxAllowedLoan) {
        userData.loanAmount = step4.maxAllowedLoan;
    }

    if (step4.status === 'REJECTED') return step4;

    // UPDATED ORDER: LoanAdvisor runs BEFORE Sanction so we know the best loan
    // product BEFORE generating the letter. This ensures EMI consistency.
    // Why needed in banking: The sanction letter is a legal document — the terms
    // it shows must exactly match what the system decided to offer.
    const loanAdvice = loanAdvisorAgent(userData);

    // Banks never approve loans if no product eligibility exists.
    if (loanAdvice.eligibleLoans.length === 0) {
        return {
            status: 'REJECTED',
            reason: 'Requested loan amount is below minimum or no suitable loan product found.',
            loanAdvice: loanAdvice
        };
    }

    // Build the bestLoanDetails object to pass into sanctionAgent.
    const bestLoanDetails = {
        name: loanAdvice.bestLoan,
        interestRate: loanAdvice.emiDetails.interestRate,
        tenureMonths: loanAdvice.emiDetails.tenureMonths,
    };

    // SanctionAgent now uses bestLoan terms — no more hardcoded rate/tenure
    const step5 = sanctionAgent(userData, bestLoanDetails, step4.risk);

    return { ...step5, loanAdvice };
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
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ success: false, message: 'Message is required and must be a string.' });
        }

        const result = await geminiModel.generateContent(message);
        const reply = result.response.text();

        return res.json({ reply });
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
