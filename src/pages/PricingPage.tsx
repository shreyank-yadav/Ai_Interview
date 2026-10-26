/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Check,
  Zap,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { PaymentOrder } from '../types/index.ts';
import { api } from '../services/api.ts';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PricingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [payments, setPayments] = useState<PaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.getPaymentHistory();
      setPayments(res.payments || []);
    } catch (err) {
      console.warn('[Pricing] Error loading payment ledger:', err);
    }
  };

  // 1. Direct Server-Side Test Simulation (Verifies authentic HMAC SHA256 Signature calculation on server)
  const handleSimulatePayment = async () => {
    setSimulatingPayment(true);
    setStatusMessage(null);
    try {
      const res = await api.simulateTestCheckout('premium');
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Payment verified! Server verified HMAC SHA256 signature for Order: ${res.orderId}. Your account is upgraded to Premium!`,
        });
        await refreshUser();
        fetchHistory();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Payment simulation failed' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Payment verification failed' });
    } finally {
      setSimulatingPayment(false);
    }
  };

  // 2. Razorpay Modal Checkout flow (Opens Razorpay test checkout window)
  const handleRazorpayModalCheckout = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      // Create Order server-side
      const order = await api.createPaymentOrder('premium');

      if (!window.Razorpay) {
        setStatusMessage({
          type: 'error',
          text: 'Razorpay checkout script not loaded. Please use the "Instant Test Checkout" button below.',
        });
        setIsLoading(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Tanya AI Interviewer',
        description: 'Premium Unlimited Subscription (Test Mode)',
        image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=100',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            // Verify signature on backend
            const verifyRes = await api.verifyPaymentSignature({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setStatusMessage({
                type: 'success',
                text: 'Razorpay payment verified successfully! Premium subscription activated.',
              });
              await refreshUser();
              fetchHistory();
            } else {
              setStatusMessage({ type: 'error', text: verifyRes.message });
            }
          } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Signature verification failed' });
          }
        },
        prefill: {
          name: user?.name || 'Alex Mercer',
          email: user?.email || 'alex@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setStatusMessage({ type: 'error', text: 'Payment flow cancelled by user.' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('[Pricing] Checkout error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Could not initiate Razorpay checkout' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
          <Zap className="h-3.5 w-3.5 text-indigo-400" />
          RAZORPAY TEST MODE INTEGRATION
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm text-slate-300">
          Prepare with Tanya without limitations. Elevate your technical and behavioral skills with real-time feedback, deep resume analysis, and coding sandboxes.
        </p>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`mx-auto max-w-3xl rounded-xl border p-4 text-xs font-semibold flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
              : 'border-red-500/40 bg-red-950/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* Free Plan */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Tier</span>
              {user?.subscriptionTier === 'free' && (
                <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                  CURRENT PLAN
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">Free Plan</h2>
            <p className="text-xs text-slate-400 mt-1">Foundational practice to experience Tanya's AI evaluations.</p>

            <div className="my-6">
              <span className="text-4xl font-extrabold text-white">₹0</span>
              <span className="text-xs text-slate-400"> / forever</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>3 Free AI Mock Interviews</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Standard HR & Behavioral questions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Basic scorecard & feedback</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <span className="h-4 w-4 flex items-center justify-center font-bold">&times;</span>
                <span>Unlimited sessions</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <span className="h-4 w-4 flex items-center justify-center font-bold">&times;</span>
                <span>Monaco DSA Coding Sandbox & Big-O Analyzer</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <button
              disabled={user?.subscriptionTier === 'free'}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-semibold text-slate-300 disabled:opacity-50"
            >
              {user?.subscriptionTier === 'free' ? 'Active Plan' : 'Free Tier'}
            </button>
          </div>
        </div>

        {/* Premium Plan (Featured) */}
        <div className="relative flex flex-col justify-between rounded-3xl border border-indigo-500/40 bg-gradient-to-b from-indigo-950/30 via-slate-900 to-slate-950 p-8 shadow-2xl ring-1 ring-indigo-500/30">
          {/* Popular Tag */}
          <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-1 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-lg">
            MOST POPULAR
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pro Candidate</span>
              {user?.subscriptionTier === 'premium' && (
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  CURRENT ACTIVE PLAN
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Premium Tier
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-1">Complete mastery toolkit with unlimited interviews and sandboxes.</p>

            <div className="my-6">
              <span className="text-4xl font-extrabold text-white">₹1,499</span>
              <span className="text-xs text-slate-400"> / month</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-200">
              <li className="flex items-center gap-2 font-medium">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Unlimited Tanya AI Mock Interviews</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Full Monaco DSA Sandbox with Big-O AI complexity review</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Resume-tailored interviews & ATS scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Real-time voice synthesis and speech recognition</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Downloadable PDF Scorecards & model answers</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
            <button
              onClick={handleSimulatePayment}
              disabled={simulatingPayment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-3 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-purple-500 transition cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              {simulatingPayment
                ? 'Verifying HMAC Signature...'
                : user?.subscriptionTier === 'premium'
                ? 'Re-Verify / Renew Premium (Test Mode)'
                : 'Instant Test Checkout (1-Click Test Payment)'}
            </button>

            <button
              onClick={handleRazorpayModalCheckout}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
              {isLoading ? 'Loading Razorpay...' : 'Launch Razorpay Modal Window'}
            </button>
          </div>
        </div>
      </div>

      {/* Razorpay Test Instructions Banner */}
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-400" />
          Razorpay Test Mode Integration Details
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          This platform utilizes server-side Razorpay order creation and HMAC SHA256 cryptographic signature verification. When you checkout:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="font-bold text-slate-200 block mb-1">1. Server Order</span>
            Creates unique Razorpay order with currency INR and idempotency receipt ID.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="font-bold text-slate-200 block mb-1">2. Checkout Window</span>
            Client modal loads test cards (e.g. Card: <code className="text-indigo-400">any valid number</code>, OTP: <code className="text-indigo-400">123456</code>).
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <span className="font-bold text-slate-200 block mb-1">3. HMAC Verification</span>
            Server calculates <code className="text-emerald-400">HMAC_SHA256(order_id|payment_id, secret)</code> before granting subscription.
          </div>
        </div>
      </div>

      {/* Payment History Ledger */}
      {payments.length > 0 && (
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Payment History Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Order ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 pl-2 font-mono text-white">{p.orderId}</td>
                    <td className="py-3 font-bold text-white">₹{p.amount / 100}</td>
                    <td className="py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-mono text-slate-400">{p.razorpayPaymentId || 'pending'}</td>
                    <td className="py-3 pr-2 text-right">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
