/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { dbStore } from '../db/store.ts';
import { PaymentOrder, SubscriptionTier } from '../db/schema.ts';

const isProduction = process.env.NODE_ENV === 'production';

// Retrieve Razorpay credentials safely
export function getRazorpayCredentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (isProduction) {
    if (!keyId || !keySecret || keyId.includes('YourTestKeyIdHere') || keySecret.includes('YourTestKeySecretHere')) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured with valid credentials in production.'
      );
    }
    return { keyId: keyId.trim(), keySecret: keySecret.trim() };
  }

  // Development defaults
  return {
    keyId: (keyId && !keyId.includes('YourTestKeyIdHere')) ? keyId.trim() : 'rzp_test_TanyaAITestKey123',
    keySecret: (keySecret && !keySecret.includes('YourTestKeySecretHere')) ? keySecret.trim() : 'tanya_rzp_test_secret_998877',
  };
}

export interface CreateOrderParams {
  userId: string;
  tier: SubscriptionTier;
  amountInINR: number;
}

/**
 * Creates a server-side Razorpay Order.
 * Issue 5 & 9: In production, requires real Razorpay credentials.
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const amountInPaise = Math.round(params.amountInINR * 100);
  const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let razorpayOrderId = `order_${Math.random().toString(36).substring(2, 10)}${Date.now().toString().slice(-4)}`;

  // Attempt live Razorpay API order creation
  if (keyId && keySecret && !keyId.startsWith('rzp_test_TanyaAITestKey123')) {
    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            userId: params.userId,
            tier: params.tier,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        razorpayOrderId = data.id;
      } else {
        const errorText = await res.text();
        console.warn('[Razorpay API] Order creation returned HTTP', res.status, errorText);
        if (isProduction) {
          throw new Error(`Razorpay gateway order creation failed with status ${res.status}: ${errorText}`);
        }
      }
    } catch (err: any) {
      console.warn('[Razorpay API] Live API call error:', err);
      if (isProduction) {
        throw new Error(`Razorpay order initiation failed in production: ${err.message}`);
      }
    }
  }

  // Store order record in database
  const orderRecord: PaymentOrder = {
    id: `pay_${Date.now()}`,
    orderId: razorpayOrderId,
    userId: params.userId,
    amount: amountInPaise,
    currency: 'INR',
    status: 'created',
    tier: params.tier,
    createdAt: new Date().toISOString(),
  };

  dbStore.createPaymentOrder(orderRecord);

  return {
    orderId: razorpayOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId,
  };
}

/**
 * Verify Razorpay payment signature server-side using HMAC SHA256.
 * Signature Formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 * Issue 5: No mock signature bypasses permitted.
 */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): { isValid: boolean; error?: string } {
  try {
    const { keySecret } = getRazorpayCredentials();
    const text = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const providedBuffer = Buffer.from(params.razorpaySignature, 'utf-8');

    let isValid = false;
    if (generatedBuffer.length === providedBuffer.length) {
      isValid = crypto.timingSafeEqual(generatedBuffer, providedBuffer);
    }

    return { isValid };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Signature calculation failed' };
  }
}

/**
 * Handle successful payment verification and upgrade user subscription.
 * Issue 5: Subscriptions are strictly granted only upon verified HMAC SHA256 signature.
 */
export function processSuccessfulPayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): { success: boolean; message: string; tier?: string } {
  const order = dbStore.getPaymentOrderByOrderId(params.orderId);
  if (!order) {
    return { success: false, message: 'Payment order record not found in system.' };
  }

  // Check idempotency: If already marked paid, return success without duplicate action
  if (order.status === 'paid') {
    return { success: true, message: 'Payment order already processed (idempotent)', tier: order.tier };
  }

  // Cryptographic Signature verification
  const verification = verifyRazorpaySignature({
    razorpayOrderId: params.orderId,
    razorpayPaymentId: params.paymentId,
    razorpaySignature: params.signature,
  });

  if (!verification.isValid) {
    dbStore.updatePaymentOrder(params.orderId, { status: 'failed' });
    return { success: false, message: 'Invalid payment signature. Cryptographic verification failed.' };
  }

  // Update payment order to paid
  dbStore.updatePaymentOrder(params.orderId, {
    status: 'paid',
    razorpayPaymentId: params.paymentId,
    razorpaySignature: params.signature,
  });

  // Upgrade user subscription
  const user = dbStore.findUserById(order.userId);
  if (user) {
    dbStore.updateUser(user.id, {
      subscriptionTier: order.tier,
      interviewCreditsRemaining: order.tier === 'premium' ? 999 : 5,
    });
  }

  dbStore.logAction(
    'SUBSCRIPTION_UPGRADED',
    user?.email || order.userId,
    `Upgraded to ${order.tier} tier via Razorpay Order ${order.orderId}`
  );

  return { success: true, message: 'Subscription successfully upgraded to Premium!', tier: order.tier };
}

/**
 * Verify incoming webhook from Razorpay
 */
export function verifyRazorpayWebhook(rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader || !rawBody) return false;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || (isProduction ? '' : 'tanya_webhook_sec_112233');
  if (!webhookSecret) return false;

  try {
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expBuffer = Buffer.from(expected, 'utf-8');
    const headerBuffer = Buffer.from(signatureHeader, 'utf-8');

    if (expBuffer.length !== headerBuffer.length) return false;
    return crypto.timingSafeEqual(expBuffer, headerBuffer);
  } catch {
    return false;
  }
}
