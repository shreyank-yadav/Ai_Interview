# Deployment Guide

Tanya AI Interviewer is designed for modern container and cloud runtimes (e.g., Google Cloud Run, AWS ECS, Docker, or Node.js hosting).

## 1. Production Build

To compile both client and server assets for production:
```bash
npm run build
```
This builds the optimized frontend bundle into `dist/`.

## 2. Running in Production

Set `NODE_ENV=production` and start the server:
```bash
npm start
```
The server will run on `http://0.0.0.0:${PORT:-3000}` and serve static production assets from `dist/` with full API support.

## 3. Environment Variables in Production

Ensure the following variables are configured in your container or hosting environment:
- `PORT`: (default 3000)
- `NODE_ENV`: `production`
- `GEMINI_API_KEY`: Google Gemini API key.
- `RAZORPAY_KEY_ID`: Razorpay key ID.
- `RAZORPAY_KEY_SECRET`: Razorpay secret.
- `APP_URL`: Production domain URL.
