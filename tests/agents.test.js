// ADDED FOR HACKATHON — Jest + Supertest integration tests
// What it does: Automated tests to verify each agent's behaviour.
// Why needed: Prevents regressions when you modify agent logic.
// How to run: npm test

const request = require('supertest');

// Override env vars before app loads
process.env.GEMINI_API_KEY = 'test-key-does-not-call-gemini';
process.env.PORT = 5001;

// Mock the Gemini module so tests don't make real API calls
jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    text: () =>
                        '{"name":"Test User","age":30,"loanAmount":200000,"purpose":"education","monthlySalary":50000,"creditScore":700,"panNumber":"ABCDE1234F","aadhaarNumber":"123456789012","district":"Pune","state":"Maharashtra"}',
                },
            }),
        }),
    })),
}));

const app = require('../index');

// All valid test data — should PASS all agents
const validPayload = {
    name: 'Swapnil Hingane',
    age: 28,
    loanAmount: 300000,
    purpose: 'Home Renovation',
    monthlySalary: 60000,
    creditScore: 720,
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    district: 'Pune',
    state: 'Maharashtra',
};

// -------------------------------------------------------
// TEST 1: Happy Path — All valid data → Loan Approved
// -------------------------------------------------------
test('TC01: Valid applicant should receive loan approval', async () => {
    const res = await request(app).post('/api/chat').send(validPayload);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Loan Approved!');
    expect(res.body.sanctionLetter).toContain('SARATHI BANK');
});

// -------------------------------------------------------
// TEST 2: Age Rejection — age 17 is below 21 limit
// -------------------------------------------------------
test('TC02: Applicant under 21 should be rejected', async () => {
    const res = await request(app).post('/api/chat').send({ ...validPayload, age: 17 });
    expect(res.statusCode).toBe(400); // fails input validation (age 18-80 check)
    expect(res.body.success).toBe(false);
});

// -------------------------------------------------------
// TEST 3: Low Credit Score — below 650 minimum
// -------------------------------------------------------
test('TC03: Credit score below 650 should be rejected', async () => {
    const res = await request(app).post('/api/chat').send({ ...validPayload, creditScore: 580 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toMatch(/credit score/i);
});

// -------------------------------------------------------
// TEST 4: Fake PAN — invalid format
// -------------------------------------------------------
test('TC04: Invalid PAN card format should be rejected', async () => {
    const res = await request(app).post('/api/chat').send({ ...validPayload, panNumber: 'FAKEPAN123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toMatch(/pan/i);
});

// -------------------------------------------------------
// TEST 5: Loan Too High — exceeds 10× annual salary
// -------------------------------------------------------
test('TC05: Loan exceeding salary limit should be rejected by underwriting', async () => {
    const res = await request(app).post('/api/chat').send({ ...validPayload, loanAmount: 100000000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.reason).toMatch(/max allowed/i);
});

// -------------------------------------------------------
// TEST 6: Health Check
// -------------------------------------------------------
test('TC06: GET / should return health status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
});

// -------------------------------------------------------
// TEST 7: Missing Required Fields → 400 Validation Error
// -------------------------------------------------------
test('TC07: Missing name and loanAmount should return 400', async () => {
    const res = await request(app).post('/api/chat').send({ age: 30, creditScore: 700 });
    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.length).toBeGreaterThan(0);
});

// -------------------------------------------------------
// TEST 8 (LoanAdvisor): Good applicant → multiple loans eligible
// Scenario: salary=80000, creditScore=750, age=30
// Expected: eligible for Personal, Home, Education, Gold Loan
//           bestLoan is selected and EMI is calculated
// -------------------------------------------------------
test('TC08: Good applicant should be eligible for multiple loans with bestLoan selected', async () => {
    const goodApplicant = {
        name: 'Ramesh Sharma',
        age: 30,
        loanAmount: 500000,
        purpose: 'Home Renovation',
        monthlySalary: 80000,   // qualifies for both Personal (≥20k) and Home (≥50k)
        creditScore: 750,       // qualifies for Personal (≥650), Home (≥700), Gold (≥600)
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '123456789012',
        district: 'Pune',
        state: 'Maharashtra',
    };
    const res = await request(app).post('/api/chat').send(goodApplicant);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // LoanAdvisor must fire and include loanAdvice in response
    expect(res.body.loanAdvice).toBeDefined();
    // Multiple loans must be eligible
    expect(res.body.loanAdvice.eligibleLoans.length).toBeGreaterThan(1);
    // A best loan must be selected
    expect(res.body.loanAdvice.bestLoan).not.toBeNull();
    // EMI must be calculated for the best loan
    expect(res.body.loanAdvice.emiDetails).toBeDefined();
    expect(res.body.loanAdvice.emiDetails.emi).toBeGreaterThan(0);
    console.log('[TC08] Eligible loans:', res.body.loanAdvice.eligibleLoans);
    console.log('[TC08] Best loan:', res.body.loanAdvice.bestLoan, '| EMI: ₹', res.body.loanAdvice.emiDetails.emi);
});

// -------------------------------------------------------
// TEST 9 (LoanAdvisor): Low credit (580) → rejected by pipeline
//                        Only Education Loan would have been eligible
// Scenario: credit score 580 < 650 → rejected by verificationAgent
//           loanAdvisorAgent still runs and must show Education Loan eligible
//           (Education Loan has no credit score minimum)
// -------------------------------------------------------
test('TC09: Low credit applicant should see Education Loan as eligible in loanAdvice', async () => {
    const lowCreditApplicant = {
        name: 'Priya Patil',
        age: 25,                // age ≤ 35 → qualifies for Education Loan
        loanAmount: 200000,
        purpose: 'Education',
        monthlySalary: 35000,
        creditScore: 580,       // below 650 → rejected by pipeline
        panNumber: 'PQRST5678Z',
        aadhaarNumber: '987654321012',
        district: 'Mumbai',
        state: 'Maharashtra',
    };
    const res = await request(app).post('/api/chat').send(lowCreditApplicant);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(false);           // main pipeline rejects
    expect(res.body.reason).toMatch(/credit score/i);
    // But loanAdvice must still appear (runs on rejection path)
    expect(res.body.loanAdvice).toBeDefined();
    // Education Loan has no credit score minimum, so it must still be eligible
    expect(res.body.loanAdvice.eligibleLoans).toContain('Education Loan');
    console.log('[TC09] Eligible despite rejection:', res.body.loanAdvice.eligibleLoans);
});

// -------------------------------------------------------
// TEST 10 (LoanAdvisor): Low salary (12000) → improvement tips returned
// Scenario: salary 12000 is below minimum for Personal (20k) and Home (50k)
//           Gold Loan also needs creditScore ≥ 600
//           Education Loan (age ≤ 35) may be the only option
//           improvementTips must be returned with actionable advice
// -------------------------------------------------------
test('TC10: Low salary applicant should receive improvement tips in loanAdvice', async () => {
    const lowSalaryApplicant = {
        name: 'Student Kumar',
        age: 22,
        loanAmount: 100000,
        purpose: 'Business',
        monthlySalary: 12000,   // below Personal Loan min (20k) and Home Loan min (50k)
        creditScore: 620,       // qualifies for Gold (≥600) but not Personal (≥650)
        panNumber: 'KLMNO6789P',
        aadhaarNumber: '112233445566',
        district: 'Nagpur',
        state: 'Maharashtra',
    };
    const res = await request(app).post('/api/chat').send(lowSalaryApplicant);
    expect(res.statusCode).toBe(200);
    // May be approved or rejected depending on pipeline — we only test loanAdvice
    expect(res.body.loanAdvice).toBeDefined();
    // Improvement tips must be present because salary is too low for major loans
    expect(Array.isArray(res.body.loanAdvice.improvementTips)).toBe(true);
    expect(res.body.loanAdvice.improvementTips.length).toBeGreaterThan(0);
    // ineligibleReasons must explain why Personal and Home Loan were denied
    expect(res.body.loanAdvice.ineligibleReasons).toBeDefined();
    console.log('[TC10] Improvement tips:', res.body.loanAdvice.improvementTips);
});

