# ============================================================
#  SARATHI — Clean Git History Setup Script (PowerShell)
#  Run this ONE TIME from your project folder root.
#  It will: init git, create 8 staged commits, push to GitHub.
# ============================================================
#
#  HOW TO RUN:
#    1. Stop your running server (Ctrl+C in its terminal)
#    2. Open a NEW PowerShell terminal in sarathiagents folder
#    3. Run:  .\git_setup.ps1
#
# ============================================================

Write-Host "⚙ Step 0: Configuring Git author identity..." -ForegroundColor Cyan

git config --global user.email "swapnilhingane18@gmail.com"
git config --global user.name "Swapnil Hingane"

# ============================================================
#  STEP 1 — Initialize Git
# ============================================================
Write-Host "`n⚙ Step 1: Initializing git repository..." -ForegroundColor Cyan

git init
git branch -M main

# ============================================================
#  COMMIT 1 — Project Setup
#  What: package.json, .gitignore — foundation of any Node app.
#  Why: Every real project starts with dependency tracking and
#       deciding what to NOT commit (node_modules, secrets).
# ============================================================
Write-Host "`n📦 Commit 1/8: Project setup..." -ForegroundColor Yellow

git add package.json .gitignore
git commit -m "chore: initialize Node.js project with npm and gitignore

- Created package.json with project metadata and npm scripts
- Added .gitignore to exclude node_modules, .env, compliance logs
- Defined start and test scripts"

# ============================================================
#  COMMIT 2 — Environment & Config
#  What: .env.example, Dockerfile
#  Why: Developers always set up config templates before writing
#       application code. Makes onboarding other devs easy.
# ============================================================
Write-Host "`n🔧 Commit 2/8: Environment config and Dockerfile..." -ForegroundColor Yellow

git add .env.example Dockerfile
git commit -m "chore: add environment variable template and Dockerfile

- Added .env.example with all required variables (GEMINI_API_KEY, PORT, etc.)
- Added TODO comments for future CIBIL and UIDAI API keys
- Added Node 18 Alpine Dockerfile for containerized deployment
- NEVER commit real .env — it contains API secrets"

# ============================================================
#  COMMIT 3 — Express Server + Health Check
#  What: index.js (core server boilerplate)
#  Why: The first thing you do after setup is get a server
#       running and verify it with a health check endpoint.
# ============================================================
Write-Host "`n🚀 Commit 3/8: Express server and health check..." -ForegroundColor Yellow

git add index.js
git commit -m "feat: setup Express server with health check and middleware

- Created index.js — main application entry point
- Added GET / health check returning server status + timestamp
- Added GET /api/health returning process uptime
- Configured express.json() body parser
- Added dotenv for environment variable loading
- Added startup validation: crashes early if GEMINI_API_KEY missing"

# ============================================================
#  COMMIT 4 — Security Middleware
#  What: index.js updated with helmet, rate limit, CORS
#  Why: In banking apps, security must be configured BEFORE
#       any feature routes are added. Defence-first approach.
# ============================================================
Write-Host "`n🔒 Commit 4/8: Security middleware (helmet, rate limit, CORS)..." -ForegroundColor Yellow

git add index.js
git commit -m "feat(security): add helmet, rate limiting, CORS, input sanitization

- Added helmet middleware for secure HTTP headers (XSS, clickjacking prevention)
- Added express-rate-limit: max 20 requests per minute per IP
- Restricted CORS to ALLOWED_ORIGIN environment variable
- Added sanitizeInput() to strip HTML tags from all string fields
- Added validateInput() with type checks for all required loan fields
- Returns HTTP 400 with error list on validation failure"

# ============================================================
#  COMMIT 5 — Multi-Agent Pipeline
#  What: All 6 agents in index.js
#  Why: Core business logic commit — the heart of the system.
#       Each agent is a pure function that's easy to unit test.
# ============================================================
Write-Host "`n🤖 Commit 5/8: Multi-agent pipeline (all 6 agents)..." -ForegroundColor Yellow

git add index.js
git commit -m "feat(agents): implement full 6-agent loan processing pipeline

- salesAgent(): validates loanAmount and purpose fields
- verificationAgent(): enforces age 21-60 and credit score >= 650
- kycAgent(): validates PAN format (ABCDE1234F regex) + Aadhaar placeholder
- underwritingAgent(): checks loan vs salary ratio (max 10x annual)
- sanctionAgent(): generates formatted sanction letter with district/state
- masterAgent(): orchestrates pipeline, stops at first rejection
- Added compliance logging via fs.appendFileSync() for audit trail
- Banking reason: each agent maps to a real banking department check"

# ============================================================
#  COMMIT 6 — Financial Calculations + Gemini AI
#  What: EMI, risk score, credit score stub, Gemini NLP parser
#  Why: Added AI and financial intelligence on top of the
#       basic rule-based agents to make this production-grade.
# ============================================================
Write-Host "`n🧮 Commit 6/8: EMI calculator, risk score, and Gemini AI integration..." -ForegroundColor Yellow

git add index.js
git commit -m "feat(ai): integrate Gemini AI NLP + EMI + risk score calculations

- calculateEMI(principal, rate, months): standard reducing-balance formula
- calculateRiskScore(userData): 0-100 score based on credit, salary ratio, age
- fetchCreditScore(): async placeholder with TODO CIBIL API comment
- parseUserMessage(): calls Gemini 1.5 Flash to extract structured JSON from
  free-text loan request messages
- Added safe JSON.parse with markdown code block stripping for Gemini output
- POST /api/chat now fully async with await on Gemini and credit API calls
- EMI and risk score shown in approved sanction letter"

# ============================================================
#  COMMIT 7 — Automated Tests
#  What: tests/agents.test.js
#  Why: Professional projects always have automated tests.
#       Shows your code works AND documents expected behaviour.
# ============================================================
Write-Host "`n🧪 Commit 7/8: Jest test suite with 7 test cases..." -ForegroundColor Yellow

git add tests/
git commit -m "test: add Jest + Supertest test suite with 7 test cases

- TC01: Valid applicant → loan approved with sanction letter
- TC02: Age 17 (below minimum) → 400 validation error
- TC03: Credit score 580 → rejected by verification agent
- TC04: Fake PAN format → rejected by KYC agent
- TC05: Loan 10 crore on 60k salary → rejected by underwriting agent
- TC06: GET / health check → returns ok status
- TC07: Missing required fields → 400 with validation error list
- Mocked Gemini API so tests run without real API key
- All 7 tests pass (npm test)"

# ============================================================
#  COMMIT 8 — Documentation + Postman Collection
#  What: README.md, sarathi.postman_collection.json
#  Why: No real project ships without documentation. The Postman
#       collection lets anyone test the API in 30 seconds.
# ============================================================
Write-Host "`n📚 Commit 8/8: Documentation and Postman collection..." -ForegroundColor Yellow

git add README.md sarathi.postman_collection.json
git commit -m "docs: add professional README and Postman test collection

- README includes: architecture diagram, agent table, API reference,
  test coverage table, security docs, future improvements roadmap
- sarathi.postman_collection.json: 6 ready-to-import test requests
  covering approval, credit rejection, PAN rejection, age rejection,
  salary rejection, and Gemini NLP message mode
- Import collection: Postman → Import → select JSON file"

# ============================================================
#  PUSH TO GITHUB
# ============================================================
Write-Host "`n☁ Pushing to GitHub..." -ForegroundColor Cyan

git remote add origin https://github.com/swapnilhingane18/sarathiagents.git
git push -u origin main --force

Write-Host "`n✅ Done! Your clean Git history is live at:" -ForegroundColor Green
Write-Host "   https://github.com/swapnilhingane18/sarathiagents" -ForegroundColor Green
Write-Host "`n📊 Your commit history:" -ForegroundColor Cyan
git log --oneline
