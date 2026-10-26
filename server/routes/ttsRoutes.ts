/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { generateTanyaVoiceAudio } from '../services/geminiService.ts';

const router = Router();

// POST /api/tts/speak
router.post('/speak', async (req: Request, res: Response): Promise<any> => {
  const { text, voiceName } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  const persona = dbStore.getTanyaPersona();
  const selectedVoice = voiceName || persona.voiceName || 'Kore';

  const audioBuffer = await generateTanyaVoiceAudio(text, selectedVoice);

  if (audioBuffer) {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', audioBuffer.length);
    return res.send(audioBuffer);
  }

  // Graceful response informing frontend to use Web SpeechSynthesis
  return res.json({
    useWebSpeech: true,
    text,
    speed: persona.speakingSpeed || 1.0,
    voiceName: selectedVoice,
  });
});

export default router;
