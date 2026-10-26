# Contributing to PrepNova

We welcome contributions to PrepNova! Please follow these guidelines to ensure code quality and stability.

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Run automated tests and linting before submitting pull requests:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

## Code Guidelines

- **TypeScript**: Always write strictly typed TypeScript. Do not use unconstrained `any` in core business logic.
- **Server Separation**: Keep all Gemini LLM calls, Razorpay secret keys, and execution sandboxes on the server-side (`server/`). Never expose keys to client bundles.
- **Styling**: Tailwind CSS with responsive, accessible layout tokens.
- **Testing**: Add unit tests in `src/tests/` for new services, pricing rules, or parser logic.
