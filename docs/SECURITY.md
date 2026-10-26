# Security Architecture & Policies

Security and candidate data privacy are foundational tenets of Tanya AI Interviewer.

## 1. Secrets Management & Boundaries

- **Zero Client Leakage**: Sensitive credentials (`GEMINI_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`) are strictly maintained on the server-side environment.
- Only safe variables prefixed with `VITE_` (such as the public Razorpay Key ID for client modal invocation) are included in the frontend client bundle.
- `.env` and credential files are strictly ignored in `.gitignore`.

## 2. Cryptographic Payment Verification

- Razorpay payment orders are verified server-side using constant-time HMAC SHA256 verification:
  ```ts
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Prevent timing attacks:
  crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(receivedSignature));
  ```
- Subscriptions are upgraded **only** after the signature passes verification.
- Order records enforce idempotency to prevent duplicate callbacks or replays.

## 3. Sandboxed Code Execution

- Candidate code submitted in the Monaco editor is executed inside isolated virtual contexts (`node:vm`) with strict execution timeouts (2500ms max) and memory bounds.
- System I/O, network sockets, and file-system primitives are stripped from the sandbox environment.

## 4. Role-Based Access Control (RBAC)

- System endpoints distinguish between `candidate` and `admin` roles.
- Administrative endpoints (`/api/admin/*`) require verified administrator privileges before allowing user tier adjustments, metric auditing, or Tanya persona tuning.
