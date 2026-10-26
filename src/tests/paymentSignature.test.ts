/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { verifyRazorpaySignature, processSuccessfulPayment } from '../../server/services/razorpayService.ts';
import { dbStore } from '../../server/db/store.ts';

export async function runPaymentSignatureTests(): Promise<{ passed: boolean; message: string }> {
  console.log('--- Testing Razorpay HMAC SHA256 Signature Verification ---');

  const testSecret = process.env.RAZORPAY_KEY_SECRET || 'tanya_rzp_test_secret_998877';
  const orderId = 'order_test_12345678';
  const paymentId = 'pay_test_87654321';

  // 1. Generate valid authentic signature
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const validResult = verifyRazorpaySignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: validSignature,
  });

  if (!validResult.isValid) {
    throw new Error('Test Failed: Authentic signature was rejected by verifier!');
  }
  console.log('✓ Valid HMAC-SHA256 signature passed verification.');

  // 2. Tampered signature test
  const tamperedSignature = validSignature.substring(0, validSignature.length - 4) + 'abcd';
  const tamperedResult = verifyRazorpaySignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: tamperedSignature,
  });

  if (tamperedResult.isValid) {
    throw new Error('Security Breach: Tampered signature was falsely accepted!');
  }
  console.log('✓ Tampered signature was successfully rejected.');

  // 3. Idempotency test
  dbStore.createPaymentOrder({
    id: 'pay_test_rec_1',
    orderId,
    userId: 'user_candidate_1',
    amount: 149900,
    currency: 'INR',
    status: 'created',
    tier: 'premium',
    createdAt: new Date().toISOString(),
  });

  const firstProcess = processSuccessfulPayment({
    orderId,
    paymentId,
    signature: validSignature,
  });

  if (!firstProcess.success) {
    throw new Error(`First payment failed: ${firstProcess.message}`);
  }
  console.log('✓ First payment successfully processed and user upgraded.');

  const secondProcess = processSuccessfulPayment({
    orderId,
    paymentId,
    signature: validSignature,
  });

  if (!secondProcess.success || !secondProcess.message.includes('idempotent')) {
    throw new Error('Idempotency violation: Duplicate order callback not safely handled!');
  }
  console.log('✓ Idempotent duplicate payment handled safely.');

  return { passed: true, message: 'All Payment signature & idempotency tests passed!' };
}
