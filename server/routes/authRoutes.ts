/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { User } from '../db/schema.ts';

const router = Router();

// Simple session token generator for demonstration and security without external session dependencies
function generateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64');
}

export function extractUserIdFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (decoded.exp && decoded.exp > Date.now()) {
      return decoded.userId;
    }
  } catch {
    // If not a base64 session token, check if it's a direct user ID (for demo ease)
    const user = dbStore.findUserById(token);
    if (user) return user.id;
  }
  return null;
}

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): any => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = dbStore.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: role === 'admin' ? 'admin' : 'candidate',
    subscriptionTier: 'free',
    interviewCreditsRemaining: 3, // 3 free credits on signup
    createdAt: new Date().toISOString(),
    passwordHash: password, // In production use bcrypt
  };

  dbStore.createUser(newUser);
  const token = generateToken(newUser.id);
  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({ user: safeUser, token });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): any => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = dbStore.findUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user.id);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req: Request, res: Response): any => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const user = dbStore.findUserByEmail(email);
  if (!user) {
    // Return friendly message even if user doesn't exist for security
    return res.json({ message: 'If this email exists, password has been reset.' });
  }

  dbStore.updateUser(user.id, { passwordHash: newPassword });
  dbStore.logAction('PASSWORD_RESET', user.email, 'User password was reset successfully');
  return res.json({ message: 'Password has been successfully updated.' });
});

// PUT /api/auth/profile
router.put('/profile', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, avatarUrl } = req.body;
  const updated = dbStore.updateUser(userId, {
    ...(name && { name: name.trim() }),
    ...(avatarUrl && { avatarUrl: avatarUrl.trim() }),
  });

  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...safeUser } = updated;
  return res.json({ user: safeUser });
});

// POST /api/auth/demo-login (Quick login helper for evaluation)
router.post('/demo-login', (req: Request, res: Response): any => {
  const { role } = req.body; // 'candidate' | 'admin' | 'free'
  let targetEmail = 'candidate@tanya-ai.com';
  if (role === 'admin') targetEmail = 'admin@tanya-ai.com';
  if (role === 'free') targetEmail = 'free@tanya-ai.com';

  const user = dbStore.findUserByEmail(targetEmail);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = generateToken(user.id);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

export default router;
