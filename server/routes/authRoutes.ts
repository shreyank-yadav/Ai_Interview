/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { User } from '../db/schema.ts';
import { hashPassword, verifyPassword, signToken, verifySignedToken } from '../utils/auth.ts';

const router = Router();

export function extractUserIdFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const verified = verifySignedToken(token);
  return verified ? verified.userId : null;
}

// POST /api/auth/register
// Issue 1: Prevent public signup from assigning the admin role.
// Issue 3: Hash passwords with bcrypt.
router.post('/register', (req: Request, res: Response): any => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = dbStore.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Security Hardening: Public registration ALWAYS defaults strictly to 'candidate'.
  // Admin role can only be granted by existing administrators through admin management.
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: 'candidate',
    subscriptionTier: 'free',
    interviewCreditsRemaining: 3, // 3 free credits on signup
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  dbStore.createUser(newUser);
  const token = signToken(newUser.id, newUser.role);
  const { passwordHash, ...safeUser } = newUser;
  return res.status(201).json({ user: safeUser, token });
});

// POST /api/auth/login
// Issue 2: Cryptographically signed token.
// Issue 3: Bcrypt verification.
router.post('/login', (req: Request, res: Response): any => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = dbStore.findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Seamlessly upgrade legacy seed hashes to bcrypt
  if (!user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
    const upgraded = hashPassword(password);
    dbStore.updateUser(user.id, { passwordHash: upgraded });
  }

  const token = signToken(user.id, user.role);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required or token expired' });
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

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = dbStore.findUserByEmail(email);
  if (!user) {
    return res.json({ message: 'If this email exists, password has been reset.' });
  }

  dbStore.updateUser(user.id, { passwordHash: hashPassword(newPassword) });
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

  const token = signToken(user.id, user.role);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, token });
});

export default router;
