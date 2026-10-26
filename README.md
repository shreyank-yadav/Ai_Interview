# Tanya AI Interviewer — Production AI Interview Preparation SaaS

[![CI](https://github.com/google-ai-studio/tanya-ai-interviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/google-ai-studio/tanya-ai-interviewer)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Gemini_API-3.8_Flash-orange)](https://ai.google.dev/)

**Tanya AI Interviewer** is a production-ready, full-stack AI mock interview preparation platform featuring Tanya, an intelligent interviewer powered by Google Gemini. Tanya conducts realistic technical, HR behavioral, resume-specific, and algorithmic coding interviews with real-time speech synthesis, live microphone transcription, Monaco code execution, and comprehensive scorecards.

---

## 1. Key Features

- **Tanya AI Interviewer Persona**: Realistic visual interviewer with dynamic audio waveform visualizer and multi-state presence (`speaking`, `listening`, `thinking`). Configurable tone presets: Supportive Mentor, Objective Evaluator, and Strict FAANG Bar Raiser.
- **Four Assessment Tracks**:
  1. **Technical & System Design**: Distributed systems, microservices, concurrency, caching, and database trade-offs.
  2. **DSA & Coding Arena**: Live Monaco-based coding editor with isolated sandbox execution, test cases runner, and Gemini Big-O time/space complexity analysis.
  3. **Resume-Tailored Deep Dive**: Targeted grilling on the candidate's exact resume claims, projects, and tech stacks.
  4. **HR & Behavioral**: STAR methodology, conflict resolution, leadership, and culture fit.
- **Voice & Speech Integration**: Real-time microphone capture via Web Speech API with live transcript streaming, voice playback via Gemini TTS (`gemini-3.8-flash-lite-tts`) and browser synthesis fallback.
- **AI Resume Studio & ATS Analyzer**: PDF/DOCX text parsing with ATS compatibility scoring (0-100), skill cloud extraction, and one-click launch of resume-tailored interviews.
- **Monaco Coding Sandbox**: Multi-language support (JavaScript, TypeScript, Python, C++, Java) with test case verification, stdout terminal, and instant code reviews.
- **Comprehensive Scorecards**: Detailed report cards featuring 4 core pillars (Technical Accuracy, Communication Clarity, Problem Solving, Culture Alignment), hire recommendations (Strong Hire / Hire / Lean Hire / No Hire), question-by-question critiques, and printable PDF reports.
- **Razorpay Test Mode Integration**: Server-side order creation, HMAC-SHA256 cryptographic signature verification, test card support, and idempotent subscription upgrades.
- **Admin Governance Hub**: Platform analytics (interview counts, average scores, pass rates, revenue), user management, audit trails, and Tanya persona tuner.
- **1-Click Demo Profiles**: Quick-switch between Alex Mercer (Candidate PRO), Sarah Connor (Admin), and David Patel (Free Tier) for instant testing.

---

## 2. Screenshots & Visual Previews

> **Instructions for Adding Genuine Screenshots:**
> 1. Launch the platform locally with `npm run dev`.
> 2. Capture high-resolution screenshots of the following views:
>    - `docs/screenshots/dashboard.png`: Candidate dashboard with KPI metrics and interview tracks.
>    - `docs/screenshots/interview-room.png`: Tanya live room with audio visualizer and question prompt.
>    - `docs/screenshots/monaco-dsa.png`: Monaco coding editor executing test cases.
>    - `docs/screenshots/scorecard.png`: Comprehensive evaluation report card modal.
>    - `docs/screenshots/resume-studio.png`: Resume ATS parser and skills radar.
>    - `docs/screenshots/pricing-razorpay.png`: Pricing page and Razorpay test checkout flow.
> 3. Store images in `docs/screenshots/` and update references below.

```text
[ Screenshot: Candidate Dashboard with Performance KPI Cards ]
[ Screenshot: Live Interview Chamber with Tanya Avatar & Speech Recognition ]
[ Screenshot: Split-screen Monaco Code Sandbox with Test Suite ]
[ Screenshot: Candidate Scorecard with Radar Competency Breakdown ]
```

---

## 3. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Editor**: `@monaco-editor/react` with syntax highlighting and language support.
- **Backend**: Express 4.21, TypeScript via `tsx`, Node.js `vm` isolated sandbox.
- **AI Provider**: Google `@google/genai` TypeScript SDK:
  - Text & Reasoning: `gemini-3.8-flash`
  - Voice Text-to-Speech: `gemini-3.8-flash-lite-tts`
- **Payments**: Razorpay Test Mode with server-side HMAC-SHA256 signature verification.
- **Storage**: In-memory document store with JSON disk persistence (`data/tanya_database.json`).

```mermaid
graph TD
    User([Candidate / Admin Browser]) <-->|React 19 + Tailwind| Client[Vite SPA Client]
    Client <-->|REST API + Audio /api/*| Server[Express Server / Node.js]
    Server <-->|@google/genai SDK| Gemini[Gemini 3.8 Flash & TTS]
    Server <-->|HMAC SHA256| Razorpay[Razorpay Payment API]
    Server <-->|Isolated VM| Sandbox[Code Execution Engine]
    Server <-->|Disk Sync| Store[(Database Store)]
```

---

## 4. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **NPM**: `v10.x` or higher
- **Modern Browser**: Chrome, Edge, Safari, or Firefox (with microphone permissions enabled for voice mode)

---

## 5. Installation Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url> tanya-ai-interviewer
   cd tanya-ai-interviewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment configuration:
   ```bash
   cp .env.example .env
   ```

---

## 6. Environment Variable Configuration

Edit `.env` with your settings:

```env
# SERVER-SIDE ONLY (Never exposed to client)
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
NODE_ENV="development"
JWT_SECRET="your-secure-secret-key-at-least-32-chars"
RAZORPAY_KEY_ID="rzp_test_YourTestKeyIdHere"
RAZORPAY_KEY_SECRET="YourTestKeySecretHere"
RAZORPAY_WEBHOOK_SECRET="YourWebhookSecretHere"

# CLIENT-SIDE EXPOSED (Prefixed with VITE_)
VITE_RAZORPAY_KEY_ID="rzp_test_YourTestKeyIdHere"
VITE_APP_NAME="Tanya AI Interviewer"
```

---

## 7. Database Setup & Data Persistence

The database initializes automatically with rich seeds from `server/db/seed.ts` and persists changes to `data/tanya_database.json`. No external database daemon is required for local development.

Initial seed records include:
- `candidate@tanya-ai.com` (Alex Mercer - Premium candidate)
- `admin@tanya-ai.com` (Sarah Connor - Platform administrator)
- `free@tanya-ai.com` (David Patel - Free tier user)
- Pre-configured DSA challenges (Two Sum, Valid Parentheses, LRU Cache)
- Sample completed interview session with comprehensive scorecard

---

## 8. Development & Build Commands

All verified npm commands from `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts full-stack Express server with Vite middleware on port 3000 |
| `npm run build` | Compiles production assets into `dist/` |
| `npm start` | Runs full-stack server serving the production `dist/` bundle |
| `npm test` | Executes automated test suites (payments, sandbox, interview scoring) |
| `npm run lint` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `npm run clean` | Cleans build artifacts (`dist`, `server.js`) |

---

## 9. Testing

Execute all automated unit and integration tests:
```bash
npm test
```

Test coverage includes:
- `paymentSignature.test.ts`: Cryptographic HMAC SHA256 verification and replay protection.
- `codeExecution.test.ts`: Isolated Node.js sandbox test case runner and error trapping.
- `interviewFlow.test.ts`: Interview session lifecycle and scorecard generation.

---

## 10. API & Integrations Overview

- **Gemini API**:
  - Model: `gemini-3.8-flash` for evaluation, follow-ups, and resume parsing.
  - Model: `gemini-3.8-flash-lite-tts` for high-quality audio voice generation.
- **Razorpay**:
  - Endpoint `/api/payments/create-order` creates orders with currency INR.
  - Endpoint `/api/payments/verify-signature` verifies signature: `HMAC_SHA256(order_id|payment_id, secret)`.
- **Monaco Sandbox**:
  - Endpoint `/api/code/execute` runs test cases and returns execution timings.

---

## 11. Razorpay Test Payment Instructions

1. Navigate to the **Pricing & Plans** tab.
2. Choose one of two test verification methods:
   - **Method A (Instant 1-Click Test)**: Click **"Instant Test Checkout (1-Click Test Payment)"**. This executes the complete server-side order creation and cryptographic HMAC SHA256 signature verification instantly.
   - **Method B (Razorpay Checkout Modal)**: Click **"Launch Razorpay Modal Window"** to test the official Razorpay checkout popup.
3. Test Card Credentials:
   - **Card Number**: Any valid test card (e.g., standard Razorpay test card `4111 1111 1111 1111`).
   - **Expiry**: Any future date (e.g., `12/28`).
   - **CVV**: `123`.
   - **OTP**: `123456`.
4. Upon successful signature verification, your account is immediately upgraded to **Premium Unlimited**.

---

## 12. Deployment Instructions

### Deploy to Container / Cloud Run
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Production Checklist
- Set `NODE_ENV="production"`
- Provide valid `GEMINI_API_KEY`
- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Provide `JWT_SECRET` with high entropy

---

## 13. Security & Privacy Notes

- **Zero Client Leakage**: Gemini API keys and Razorpay secrets are kept exclusively on the server.
- **Timing-Safe Verification**: Signature comparisons use `crypto.timingSafeEqual` to prevent timing attacks.
- **Sandboxed Execution**: Candidate code executes inside an isolated Node VM context with a strict 2.5s execution timeout.
- **Audit Trails**: Security actions (logins, password resets, role toggles, payment verifications) are recorded in the system audit log.

---

## 14. Troubleshooting

- **Microphone blocked**: Allow microphone permissions in browser site settings, or use the integrated text area fallback.
- **No Audio**: Click "Replay Voice" on Tanya's avatar to bypass browser autoplay policies.
- **Port Conflict**: Set `PORT=3001 npm run dev` if port 3000 is occupied.

---

## 15. Known Limitations & Roadmap

- **External C++ Compiler**: C++ and Java sandbox currently uses syntax validation and deterministic emulation; a future release will integrate an isolated Docker/gVisor runner for native binaries.
- **WebRTC Video**: Tanya currently operates as an animated visual persona; full WebRTC generative video avatar integration is planned for upcoming releases.

---

## 16. Contributing & License

Contributions are welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details.
