# Security Architecture & Policies

Security and candidate data privacy are foundational tenets of Tanya AI Interviewer.

## 1. Secrets Management & Boundaries

- **Zero Client Leakage**: Sensitive credentials (`GEMINI_API_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `JWT_SECRET`) are strictly maintained on the server-side environment.
- Only safe variables prefixed with `VITE_` (such as the public Razorpay Key ID for client modal invocation) are included in the frontend client bundle.
- `.env` and credential files are strictly ignored in `.gitignore`.

## 2. Authentication, Hashing & Signed Sessions

- **Bcrypt Password Hashing**: Passwords submitted during registration and authentication are hashed using `bcryptjs` with salt work factor 10. Plain-text passwords are never stored.
- **Cryptographically Signed Session Tokens**: Sessions use HMAC-SHA256 tokens (`header.payload.signature`) signed with `JWT_SECRET` (falling back to a consistent server seed in dev).
  - Tokens expire after 7 days (`exp` timestamp validated on every request).
  - Signatures are verified using `crypto.timingSafeEqual` to prevent timing attack vulnerabilities.
  - Public registration strictly locks incoming accounts to `role: 'candidate'`, preventing privilege escalation through registration payloads.

## 3. Resource Ownership & Authorization

- **Interview Sessions (`/api/interviews/:id`)**: Candidates can only access, submit answers to, or finalize interview sessions that belong to their own authenticated `userId`. Administrators retain global auditing access.
- **Resume Records (`/api/resumes/:id`)**: Candidates can only view or delete resume profiles they personally uploaded or pasted.
- **Explicit File Storage (`STORAGE_DIR`)**: Uploaded PDF/DOCX binary files are written directly to `STORAGE_DIR` (`./data/uploads`) and tracked with `sourceType: 'file_upload'` and `storedFilePath`. Text pasted into the analyzer is explicitly designated `sourceType: 'pasted_text'` with no false upload metadata. On resume deletion, both the database record and physical disk file are purged.

## 4. Cryptographic Payment Verification & Production Guards

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
- **Production Payment Lockout**: In production (`NODE_ENV === 'production'`), payment simulation (`/api/payments/test-checkout-simulate`) is blocked with HTTP 403 Forbidden. Fake credentials or signature bypass strings are explicitly rejected. Real Razorpay test/production credentials are required.

## 5. Sandboxed Code Execution

- Candidate code submitted in the Monaco editor is executed inside isolated virtual contexts (`node:vm`) with strict execution timeouts (2500ms max) and memory bounds.
- System I/O, network sockets, and file-system primitives are stripped from the sandbox environment.

## 6. Role-Based Access Control (RBAC)

- System endpoints distinguish between `candidate` and `admin` roles.
- Administrative endpoints (`/api/admin/*`) require verified administrator privileges before allowing user tier adjustments, metric auditing, or Tanya persona tuning.
