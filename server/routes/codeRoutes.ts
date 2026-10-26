/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { executeCodeSandbox } from '../services/codeExecutionService.ts';

const router = Router();

// GET /api/code/problems
router.get('/problems', (_req: Request, res: Response) => {
  const problems = dbStore.getProblems();
  res.json({ problems });
});

// GET /api/code/problems/:id
router.get('/problems/:id', (req: Request, res: Response): any => {
  const problem = dbStore.getProblemById(req.params.id);
  if (!problem) {
    return res.status(404).json({ error: 'Coding problem not found' });
  }
  res.json({ problem });
});

// POST /api/code/execute
router.post('/execute', async (req: Request, res: Response): Promise<any> => {
  const { language = 'javascript', code, problemId, testCases } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Source code is required' });
  }

  // If problemId provided and testCases not explicitly given, fetch problem's test cases
  let casesToRun = testCases;
  if (!casesToRun && problemId) {
    const prob = dbStore.getProblemById(problemId);
    if (prob) {
      casesToRun = prob.testCases;
    }
  }

  try {
    const executionResult = await executeCodeSandbox({
      language,
      code,
      problemId,
      testCases: casesToRun,
    });
    return res.json(executionResult);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Execution failed in sandbox',
    });
  }
});

export default router;
