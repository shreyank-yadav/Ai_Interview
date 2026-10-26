# Troubleshooting & Common Issues

### 1. Microphone / Voice Input Not Working
- **Cause**: Browser microphone permissions blocked or browser lacks SpeechRecognition support.
- **Solution**: Allow microphone access in your browser settings. If using a browser without Web Speech support (e.g. certain private window modes), use the built-in text input area in the speech controller.

### 2. Audio Playback Muted or Not Hearing Tanya
- **Cause**: Modern browsers block unprompted audio autoplay before user interaction.
- **Solution**: Click anywhere in the window or use the "Replay Voice" button on Tanya's avatar card. Check that the mute button on Tanya's avatar is unmuted.

### 3. Razorpay Signature Verification Error
- **Cause**: Mismatch between `RAZORPAY_KEY_SECRET` in `.env` and the secret used during signature generation.
- **Solution**: Verify that your `RAZORPAY_KEY_SECRET` in `.env` matches your Razorpay Dashboard test secret. You can also use the "Instant Test Checkout" button on the pricing page for 1-click verified testing.

### 4. Port 3000 Already in Use
- **Cause**: Another service running on port 3000.
- **Solution**: Run `PORT=3001 npm run dev` or stop the competing process.
