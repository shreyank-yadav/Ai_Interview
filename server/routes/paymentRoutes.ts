/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbStore } from '../db/store.ts';
import { extractUserIdFromHeader } from './authRoutes.ts';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  processSuccessfulPayment,
  verifyRazorpayWebhook,
  getRazorpayCredentials,
} from '../services/razorpayService.ts';

const router = Router();

// Pricing tiers
const PLAN_AMOUNTS: Record<string, number> = {
  free: 0,
  premium: 1499, // 1499 INR per month
};

// POST /api/payments/create-order
// Issue 5 & 9: Production checks and clear credential errors
router.post('/create-order', async (req: Request, res: Response): Promise<any> => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { tier = 'premium' } = req.body;
  const amount = PLAN_AMOUNTS[tier] || 1499;

  try {
    const orderData = await createRazorpayOrder({
      userId,
      tier,
      amountInINR: amount,
    });
    return res.status(201).json(orderData);
  } catch (err: any) {
    console.error('[Payments] Create order error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to initiate Razorpay order. Verify server payment credentials.',
    });
  }
});

// POST /api/payments/verify-signature
// Issue 5: Genuine HMAC SHA256 signature verification only
router.post('/verify-signature', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      error: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required',
    });
  }

  const result = processSuccessfulPayment({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  const user = dbStore.findUserById(userId);
  return res.json({
    success: true,
    message: result.message,
    user: user ? { ...user, passwordHash: undefined } : undefined,
  });
});

// POST /api/payments/test-checkout-simulate
// Issue 5: STRICTLY DISABLED IN PRODUCTION
router.post('/test-checkout-simulate', async (req: Request, res: Response): Promise<any> => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Payment simulation is strictly disabled in production. Genuine payment verification required.',
    });
  }

  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { tier = 'premium' } = req.body;
  const amount = PLAN_AMOUNTS[tier] || 1499;

  try {
    // 1. Create order
    const order = await createRazorpayOrder({
      userId,
      tier,
      amountInINR: amount,
    });

    // 2. Generate simulated payment ID
    const testPaymentId = `pay_${Date.now()}_test_${Math.random().toString(36).substring(2, 6)}`;

    // 3. Compute authentic HMAC SHA256 signature using the secret
    const { keySecret } = getRazorpayCredentials();
    const authenticSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${order.orderId}|${testPaymentId}`)
      .digest('hex');

    // 4. Process payment with verified signature
    const result = processSuccessfulPayment({
      orderId: order.orderId,
      paymentId: testPaymentId,
      signature: authenticSignature,
    });

    const updatedUser = dbStore.findUserById(userId);
    return res.json({
      success: result.success,
      message: result.message,
      orderId: order.orderId,
      paymentId: testPaymentId,
      signature: authenticSignature,
      user: updatedUser ? { ...updatedUser, passwordHash: undefined } : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Simulation execution failed.',
    });
  }
});

// POST /api/payments/webhook
router.post('/webhook', (req: Request, res: Response): any => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  const isValid = verifyRazorpayWebhook(rawBody, signature);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid or missing webhook signature' });
  }

  const event = req.body.event;
  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = req.body.payload?.payment?.entity;
    if (paymentEntity?.order_id && paymentEntity?.id) {
      // Find order to verify
      const order = dbStore.getPaymentOrderByOrderId(paymentEntity.order_id);
      if (order) {
        dbStore.updatePaymentOrder(order.orderId, {
          status: 'paid',
          razorpayPaymentId: paymentEntity.id,
        });
        const user = dbStore.findUserById(order.userId);
        if (user) {
          dbStore.updateUser(user.id, {
            subscriptionTier: order.tier,
            interviewCreditsRemaining: order.tier === 'premium' ? 999 : 5,
          });
        }
      }
    }
  }

  return res.json({ status: 'ok' });
});

// GET /api/payments/history
router.get('/history', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const allPayments = dbStore.getAllPayments();
  const userPayments = user.role === 'admin' ? allPayments : allPayments.filter(p => p.userId === userId);
  return res.json({ payments: userPayments });
});

export default router;
