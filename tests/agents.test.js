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
