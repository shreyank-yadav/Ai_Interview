/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  InterviewSession,
  InterviewReport,
  ParsedResume,
  CodingProblem,
  TanyaPersonaConfig,
  PaymentOrder,
  SystemAuditLog,
} from '../types/index.ts';

const TOKEN_KEY = 'tanya_auth_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // --- Auth ---
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, role?: string) =>
    request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),

  demoLogin: (role: 'candidate' | 'admin' | 'free') =>
    request<{ user: User; token: string }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  resetPassword: (email: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    }),

  updateProfile: (updates: { name?: string; avatarUrl?: string }) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // --- Interviews ---
  getInterviews: () => request<{ sessions: InterviewSession[] }>('/api/interviews'),

  getInterview: (id: string) => request<{ session: InterviewSession }>(`/api/interviews/${id}`),

  createInterview: (params: {
    type: string;
    roleTarget: string;
    difficulty: string;
    resumeId?: string;
    problemId?: string;
  }) =>
    request<{ session: InterviewSession }>('/api/interviews/create', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  submitAnswer: (sessionId: string, answer: string, codeSnippet?: string, language?: string) =>
    request<{
      session: InterviewSession;
      tanyaMessage: any;
      isCompleted: boolean;
      quickFeedback: string;
    }>(`/api/interviews/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer, codeSnippet, language }),
    }),

  finishInterview: (sessionId: string) =>
    request<{ session: InterviewSession; report: InterviewReport }>(`/api/interviews/${sessionId}/finish`, {
      method: 'POST',
    }),

  // --- Resumes ---
  getResumes: () => request<{ resumes: ParsedResume[] }>('/api/resumes'),

  getResume: (id: string) => request<{ resume: ParsedResume }>(`/api/resumes/${id}`),

  uploadResume: (params: { fileName: string; textContent?: string; base64Content?: string }) =>
    request<{ resume: ParsedResume }>('/api/resumes/upload', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  uploadResumeText: (fileName: string, textContent: string) =>
    request<{ resume: ParsedResume }>('/api/resumes/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, textContent }),
    }),

  deleteResume: (id: string) =>
    request<{ success: boolean }>(`/api/resumes/${id}`, {
      method: 'DELETE',
    }),

  // --- Coding & DSA ---
  getProblems: () => request<{ problems: CodingProblem[] }>('/api/code/problems'),

  getProblem: (id: string) => request<{ problem: CodingProblem }>(`/api/code/problems/${id}`),

  executeCode: (params: {
    language: string;
    code: string;
    problemId?: string;
    testCases?: any[];
  }) =>
    request<{
      success: boolean;
      stdout: string;
      stderr?: string;
      executionTimeMs: number;
      allPassed: boolean;
      totalTests: number;
      passedTests: number;
      results: any[];
      aiReview?: any;
    }>('/api/code/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // --- Payments & Razorpay ---
  createPaymentOrder: (tier: string = 'premium') =>
    request<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),

  verifyPaymentSignature: (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    request<{ success: boolean; message: string; user?: User }>('/api/payments/verify-signature', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  simulateTestCheckout: (tier: string = 'premium') =>
    request<{
      success: boolean;
      message: string;
      orderId: string;
      paymentId: string;
      signature: string;
      user?: User;
    }>('/api/payments/test-checkout-simulate', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),

  getPaymentHistory: () => request<{ payments: PaymentOrder[] }>('/api/payments/history'),

  // --- TTS ---
  synthesizeVoice: async (text: string, voiceName?: string): Promise<{ audioUrl?: string; useWebSpeech?: boolean }> => {
    try {
      const response = await fetch('/api/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName }),
      });

      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('audio/wav')) {
        const blob = await response.blob();
        return { audioUrl: URL.createObjectURL(blob) };
      }

      const json = await response.json();
      return { useWebSpeech: true, ...json };
    } catch {
      return { useWebSpeech: true };
    }
  },

  // --- Admin ---
  getAdminStats: () =>
    request<{
      totalUsers: number;
      premiumUsers: number;
      totalInterviews: number;
      completedInterviews: number;
      averageScore: number;
      passRatePercentage: number;
      totalRevenueINR: number;
      trackBreakdown: Record<string, number>;
    }>('/api/admin/stats'),

  getAdminUsers: () => request<{ users: User[] }>('/api/admin/users'),

  updateUserTier: (userId: string, tier: string, credits?: number) =>
    request<{ user: User }>(`/api/admin/users/${userId}/tier`, {
      method: 'PUT',
      body: JSON.stringify({ tier, credits }),
    }),

  updateUserRole: (userId: string, role: 'candidate' | 'admin') =>
    request<{ user: User }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  getAuditLogs: () => request<{ logs: SystemAuditLog[] }>('/api/admin/audit-logs'),

  getTanyaPersona: () => request<{ persona: TanyaPersonaConfig }>('/api/admin/tanya-persona'),

  updateTanyaPersona: (updates: Partial<TanyaPersonaConfig>) =>
    request<{ persona: TanyaPersonaConfig }>('/api/admin/tanya-persona', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};
