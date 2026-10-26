/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { extractUserIdFromHeader } from './authRoutes.ts';

const router = Router();

// Middleware to ensure user has admin role
function requireAdmin(req: Request, res: Response, next: () => void): any {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbStore.findUserById(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required' });
  }

  next();
}

// GET /api/admin/stats
router.get('/stats', requireAdmin, (_req: Request, res: Response) => {
  const users = dbStore.getAllUsers();
  const sessions = dbStore.getAllSessions();
  const payments = dbStore.getAllPayments();

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.report);
  const totalScore = completedSessions.reduce((acc, s) => acc + (s.report?.overallScore || 0), 0);
  const avgScore = completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0;

  const hireCount = completedSessions.filter(
    s => s.report?.recommendation === 'Strong Hire' || s.report?.recommendation === 'Hire'
  ).length;
  const passRate = completedSessions.length > 0 ? Math.round((hireCount / completedSessions.length) * 100) : 0;

  const totalRevenueINR = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + p.amount / 100, 0);

  const trackCounts: Record<string, number> = {
    hr: 0,
    technical: 0,
    resume: 0,
    dsa: 0,
  };
  sessions.forEach(s => {
    trackCounts[s.type] = (trackCounts[s.type] || 0) + 1;
  });

  res.json({
    totalUsers: users.length,
    premiumUsers: users.filter(u => u.subscriptionTier === 'premium').length,
    totalInterviews: sessions.length,
    completedInterviews: completedSessions.length,
    averageScore: avgScore,
    passRatePercentage: passRate,
    totalRevenueINR,
    trackBreakdown: trackCounts,
  });
});

// GET /api/admin/users
router.get('/users', requireAdmin, (_req: Request, res: Response) => {
  const users = dbStore.getAllUsers();
  res.json({ users });
});

// PUT /api/admin/users/:id/tier
router.put('/users/:id/tier', requireAdmin, (req: Request, res: Response): any => {
  const { tier, credits } = req.body;
  const updated = dbStore.updateUser(req.params.id, {
    ...(tier && { subscriptionTier: tier }),
    ...(credits !== undefined && { interviewCreditsRemaining: Number(credits) }),
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...safeUser } = updated;
  return res.json({ user: safeUser });
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', requireAdmin, (req: Request, res: Response): any => {
  const { role } = req.body;
  if (role !== 'candidate' && role !== 'admin') {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const updated = dbStore.updateUser(req.params.id, { role });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...safeUser } = updated;
  return res.json({ user: safeUser });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', requireAdmin, (_req: Request, res: Response) => {
  const logs = dbStore.getAuditLogs();
  res.json({ logs });
});

// GET /api/admin/tanya-persona
router.get('/tanya-persona', (_req: Request, res: Response) => {
  const persona = dbStore.getTanyaPersona();
  res.json({ persona });
});

// PUT /api/admin/tanya-persona
router.put('/tanya-persona', requireAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  const updated = dbStore.updateTanyaPersona(updates);
  res.json({ persona: updated });
});

export default router;
