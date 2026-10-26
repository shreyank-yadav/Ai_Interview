# API Reference — Tanya AI Interviewer

All endpoints are hosted under `/api/*`. Protected routes require a valid session Bearer token in the `Authorization` header: `Authorization: Bearer <token>`.

## Authentication Endpoints

### `POST /api/auth/register`
Creates a candidate or admin user account.
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "securepassword",
    "role": "candidate"
  }
  ```
- **Response**: `201 Created` with `{ "user": { ... }, "token": "..." }`

### `POST /api/auth/login`
Authenticates a user with email and password.
- **Response**: `200 OK` with `{ "user": { ... }, "token": "..." }`

### `GET /api/auth/me`
Fetches authenticated user profile and subscription status.

### `POST /api/auth/demo-login`
Quick switcher for evaluator convenience.
- **Body**: `{ "role": "candidate" | "admin" | "free" }`

---

## Interview Endpoints

### `GET /api/interviews`
Lists all interview sessions for the current user.

### `POST /api/interviews/create`
Initializes a new interview session.
- **Request Body**:
  ```json
  {
    "type": "technical" | "hr" | "resume" | "dsa",
    "roleTarget": "Senior Full-Stack Engineer",
    "difficulty": "senior",
    "resumeId": "resume_123",
    "problemId": "prob_two_sum"
  }
  ```

### `POST /api/interviews/:id/answer`
Submits candidate answer and receives Tanya's adaptive follow-up.
- **Request Body**:
  ```json
  {
    "answer": "To guarantee idempotency I generate UUID v4 idempotency keys...",
    "codeSnippet": "def two_sum(): ...",
    "language": "python"
  }
  ```

### `POST /api/interviews/:id/finish`
Concludes session and generates comprehensive evaluation report card with 4 category scores (0-100), hire recommendation, and benchmark answers.

---

## Code Execution Endpoints

### `POST /api/code/execute`
Executes code inside the sandbox against problem test cases.
- **Request Body**:
  ```json
  {
    "language": "javascript" | "python" | "typescript" | "cpp" | "java",
    "code": "function twoSum(nums, target) { ... }",
    "problemId": "prob_two_sum",
    "testCases": [{ "input": "[2,7,11,15], 9", "expectedOutput": "[0,1]" }]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "stdout": "...",
    "executionTimeMs": 14,
    "allPassed": true,
    "totalTests": 2,
    "passedTests": 2,
    "results": [ ... ],
    "aiReview": {
      "timeComplexity": "O(N)",
      "spaceComplexity": "O(N)",
      "qualityScore": 92,
      "tanyaFeedback": "Excellent linear scan approach!"
    }
  }
  ```

---

## Payment Endpoints (Razorpay Test Mode)

### `POST /api/payments/create-order`
Creates a server-side Razorpay order.

### `POST /api/payments/verify-signature`
Verifies Razorpay HMAC SHA256 signature server-side and activates Premium subscription.
- **Formula**: `HMAC_SHA256(order_id + "|" + payment_id, secret)`

### `POST /api/payments/test-checkout-simulate`
Executes full simulated test checkout cycle with server-side HMAC SHA256 computation.
