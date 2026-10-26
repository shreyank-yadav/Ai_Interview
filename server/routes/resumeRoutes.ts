/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { dbStore } from '../db/store.ts';
import { extractUserIdFromHeader } from './authRoutes.ts';
import { parseResumeWithGemini } from '../services/geminiService.ts';

const router = Router();

// Issue 7: Implement STORAGE_DIR properly
const STORAGE_DIR = path.resolve(process.cwd(), process.env.STORAGE_DIR || './data/uploads');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  try {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Storage] Could not create STORAGE_DIR:', err);
  }
}

// GET /api/resumes
router.get('/', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const resumes = dbStore.getUserResumes(userId);
  return res.json({ resumes });
});

// POST /api/resumes/upload
// Issue 7 & 8: Explicit file handling vs pasted text, real file storage in STORAGE_DIR
router.post('/upload', async (req: Request, res: Response): Promise<any> => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { fileName = 'resume.txt', textContent, base64Content } = req.body;

  let textToParse = textContent || '';
  let sourceType: 'file_upload' | 'pasted_text' = 'pasted_text';
  let storedFilePath: string | undefined = undefined;
  let computedFileSize = 0;

  // If genuine file data was provided via base64
  if (base64Content) {
    try {
      const cleanB64 = base64Content.replace(/^data:[^;]+;base64,/, '');
      const fileBuffer = Buffer.from(cleanB64, 'base64');
      computedFileSize = fileBuffer.length;

      // Sanitize filename and save to STORAGE_DIR
      const safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${Date.now()}_${safeFileName}`;
      const destinationPath = path.join(STORAGE_DIR, uniqueFileName);

      fs.writeFileSync(destinationPath, fileBuffer);
      storedFilePath = destinationPath;
      sourceType = 'file_upload';

      if (!textToParse) {
        // Attempt clean text extraction from uploaded buffer
        textToParse = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
      }
    } catch (err: any) {
      console.warn('[Resume] File write error:', err);
      return res.status(500).json({ error: 'Failed to write resume file to storage.' });
    }
  } else {
    // Explicitly identify pasted text
    sourceType = 'pasted_text';
    computedFileSize = Buffer.byteLength(textToParse, 'utf-8');
  }

  if (!textToParse || textToParse.trim().length < 20) {
    return res.status(400).json({
      error: 'Resume content is insufficient for analysis (minimum 20 characters required).',
    });
  }

  // Parse via Gemini
  const parsedData = await parseResumeWithGemini(textToParse, fileName);

  const resumeRecord = dbStore.saveResume({
    ...parsedData,
    id: `resume_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    fileName: sourceType === 'file_upload' ? fileName : `Pasted Text (${fileName || 'Untitled'})`,
    fileSize: computedFileSize,
    uploadedAt: new Date().toISOString(),
    sourceType,
    storedFilePath,
  });

  return res.status(201).json({ resume: resumeRecord });
});

// GET /api/resumes/:id
// Issue 4: Ownership check
router.get('/:id', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const resume = dbStore.getResumeById(req.params.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  // Ownership check
  if (resume.userId !== userId && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: You do not own this resume record.' });
  }

  return res.json({ resume });
});

// DELETE /api/resumes/:id
// Issue 4: Ownership check & cleanup from STORAGE_DIR
router.delete('/:id', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const resume = dbStore.getResumeById(req.params.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  // Ownership check
  if (resume.userId !== userId && user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: You do not have permission to delete this resume.' });
  }

  // Remove underlying file from STORAGE_DIR if it exists
  if (resume.storedFilePath && fs.existsSync(resume.storedFilePath)) {
    try {
      fs.unlinkSync(resume.storedFilePath);
    } catch (err) {
      console.warn('[Storage] Could not remove file:', resume.storedFilePath, err);
    }
  }

  const deleted = dbStore.deleteResume(req.params.id, userId);
  return res.json({ success: deleted, message: 'Resume deleted successfully' });
});

export default router;
