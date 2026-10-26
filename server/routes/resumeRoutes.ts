/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { extractUserIdFromHeader } from './authRoutes.ts';
import { parseResumeWithGemini } from '../services/geminiService.ts';

const router = Router();

// GET /api/resumes
router.get('/', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const resumes = dbStore.getUserResumes(userId);
  return res.json({ resumes });
});

// POST /api/resumes/parse-and-upload
router.post('/upload', async (req: Request, res: Response): Promise<any> => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { fileName = 'resume.pdf', textContent, base64Content } = req.body;

  let textToParse = textContent || '';
  if (!textToParse && base64Content) {
    // If base64 provided, attempt UTF-8 decode or ASCII clean
    try {
      const buffer = Buffer.from(base64Content.replace(/^data:[^;]+;base64,/, ''), 'base64');
      textToParse = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
    } catch {
      textToParse = 'Sample Resume content with engineering experience in full-stack web architectures.';
    }
  }

  if (!textToParse || textToParse.trim().length < 20) {
    return res.status(400).json({ error: 'Resume content or file text is required (minimum 20 characters).' });
  }

  // Parse via Gemini
  const parsedData = await parseResumeWithGemini(textToParse, fileName);

  const resumeRecord = dbStore.saveResume({
    id: `resume_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    fileSize: textToParse.length * 2,
    uploadedAt: new Date().toISOString(),
    ...parsedData,
  });

  return res.status(201).json({ resume: resumeRecord });
});

// GET /api/resumes/:id
router.get('/:id', (req: Request, res: Response): any => {
  const resume = dbStore.getResumeById(req.params.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  return res.json({ resume });
});

// DELETE /api/resumes/:id
router.delete('/:id', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const deleted = dbStore.deleteResume(req.params.id, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Resume not found or unauthorized' });
  }

  return res.json({ success: true, message: 'Resume deleted successfully' });
});

export default router;
