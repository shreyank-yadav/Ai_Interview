/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { hashPassword, verifyPassword, signToken, verifySignedToken } from '../../server/utils/auth.ts';

export async function runAuthSecurityTests(): Promise<{ passed: boolean; message: string }> {
  console.log('--- Testing Cryptographic JWT Signing & Bcrypt Password Hashing ---');

  // 1. Password hashing test
  const rawPassword = 'SecurePassword!123';
  const hashed = hashPassword(rawPassword);

  if (!hashed.startsWith('$2a$') && !hashed.startsWith('$2b$')) {
    throw new Error('Password hash failed: Expected bcrypt format starting with $2a$ or $2b$');
  }

  if (!verifyPassword(rawPassword, hashed)) {
    throw new Error('Password verification failed for correct password');
  }

  if (verifyPassword('WrongPassword', hashed)) {
    throw new Error('Security Breach: Incorrect password matched hash');
  }
  console.log('✓ Bcrypt password hashing and verification passed.');

  // 2. Cryptographic JWT Signing & Verification
  const userId = 'user_test_7788';
  const role = 'candidate';
  const token = signToken(userId, role, 60 * 1000); // 1 minute expiry

  const verified = verifySignedToken(token);
  if (!verified || verified.userId !== userId || verified.role !== role) {
    throw new Error('Token verification failed for authentic signed token');
  }
  console.log('✓ Cryptographic HMAC-SHA256 signed token verified.');

  // 3. Tampered token verification
  const [header, payload, sig] = token.split('.');
  // Modify payload slightly
  const tamperedPayload = Buffer.from(
    JSON.stringify({ userId: 'hacked_user', role: 'admin', exp: Date.now() + 100000 })
  ).toString('base64url');
  const tamperedToken = `${header}.${tamperedPayload}.${sig}`;

  const tamperedResult = verifySignedToken(tamperedToken);
  if (tamperedResult !== null) {
    throw new Error('Security Breach: Tampered token was falsely accepted by verifier!');
  }
  console.log('✓ Tampered token was successfully rejected.');

  // 4. Expired token verification
  const expiredToken = signToken(userId, role, -1000); // expired 1 sec ago
  const expiredResult = verifySignedToken(expiredToken);
  if (expiredResult !== null) {
    throw new Error('Security Breach: Expired token was accepted!');
  }
  console.log('✓ Expired token was rejected.');

  return { passed: true, message: 'Cryptographic Auth & Token security tests passed!' };
}
