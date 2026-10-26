# Local Setup & Installation Guide

This guide walks through cloning, configuring, and running PrepNova on your local environment.

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **NPM**: v10+
- **Google Gemini API Key**: Obtainable from Google AI Studio.

## 2. Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repo-url> tanya-ai-interviewer
   cd tanya-ai-interviewer
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in:
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `RAZORPAY_KEY_ID`: Your Razorpay test Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay test Key Secret.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Run the Automated Tests:**
   ```bash
   npm test
   ```

6. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```
