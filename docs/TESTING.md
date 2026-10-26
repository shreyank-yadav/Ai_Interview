# Testing Guide

Tanya AI Interviewer includes automated unit and integration tests covering security, algorithmic sandboxes, and interview scoring.

## 1. Running the Test Suite

Execute the test suite directly from your terminal:
```bash
npm test
```

## 2. Test Suites Overview

### Payment Signature Suite (`src/tests/paymentSignature.test.ts`)
- Verifies authentic HMAC SHA256 signature validation against Razorpay specifications.
- Proves tampered signatures with corrupted hashes are rejected immediately.
- Validates idempotency against replay callbacks.

### Code Execution Suite (`src/tests/codeExecution.test.ts`)
- Executes multi-case JavaScript problem in isolated sandbox.
- Tests syntax error trapping without host server crashes.
- Evaluates timeout bounds.

### Interview Lifecycle Suite (`src/tests/interviewFlow.test.ts`)
- Tests question answering flow and score computation.
- Assesses rubric scoring: Technical Accuracy, Communication Clarity, Problem Solving, Culture Fit.

## 3. Manual Test Scenarios

1. **Voice Input Flow**:
   - Open Tanya Live Room, click "Answer with Mic", speak response, and verify real-time transcript streaming.
2. **Monaco Coding Flow**:
   - Navigate to Coding Sandbox, select "Two Sum", click "Run Code", inspect test output, and view Tanya's Big-O analysis.
3. **Razorpay Test Checkout Flow**:
   - Go to Pricing, click "Instant Test Checkout (1-Click Test Payment)", verify HMAC signature validation and instant tier upgrade to Premium.
