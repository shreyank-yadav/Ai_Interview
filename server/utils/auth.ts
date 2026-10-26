/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const isProduction = process.env.NODE_ENV === 'production';

// Retrieve JWT Secret
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    if (isProduction) {
      throw new Error('FATAL SECURITY CONFIGURATION: JWT_SECRET must be set and at least 16 characters in production.');
    }
    return 'tanya_dev_jwt_secret_do_not_use_in_prod_32chars!';
  }
  return secret.trim();
}

export interface TokenPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Hash a plain text password using bcrypt
 */
export function hashPassword(plainText: string): string {
  return bcrypt.hashSync(plainText, 10);
}

/**
 * Verify a candidate password against stored bcrypt hash,
 * with graceful upgrade for legacy seed records
 */
export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (!storedHash || !plainText) return false;

  // Standard bcrypt hash verification
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(plainText, storedHash);
    } catch {
      return false;
    }
  }

  // Backward compatibility check for plain-text seed records
  return plainText === storedHash;
}

/**
 * Cryptographically sign a token with HMAC-SHA256 and expiration
 */
export function signToken(
  userId: string,
  role: string = 'candidate',
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days default
): string {
  const secret = getJwtSecret();
  const payload: TokenPayload = {
    userId,
    role,
    iat: Date.now(),
    exp: Date.now() + expiresInMs,
  };

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 signed token
 */
export function verifySignedToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  const secret = getJwtSecret();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as TokenPayload;
    if (!payload.userId || !payload.exp) return null;

    // Expiration check
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
