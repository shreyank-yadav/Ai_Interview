/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'candidate' | 'admin';
export type SubscriptionTier = 'free' | 'premium';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  interviewCreditsRemaining: number;
  avatarUrl?: string;
  createdAt: string;
  passwordHash: string; // Simulated SHA256
}

export type InterviewType = 'hr' | 'technical' | 'resume' | 'dsa';
export type InterviewDifficulty = 'entry' | 'mid' | 'senior' | 'staff';
export type InterviewStatus = 'in_progress' | 'completed' | 'abandoned';

export interface InterviewMessage {
  id: string;
  sender: 'tanya' | 'candidate';
  text: string;
  timestamp: string;
  audioUrl?: string;
  codeSnippet?: string;
  language?: string;
}

export interface QuestionEvaluation {
  questionId: string;
  questionText: string;
  candidateAnswer: string;
  score: number; // 0 - 100
  clarityScore: number;
  technicalAccuracyScore: number;
  depthScore: number;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
}

export interface InterviewReport {
  id: string;
  sessionId: string;
  overallScore: number; // 0 - 100
  recommendation: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire';
  summary: string;
  categoryScores: {
    technicalAccuracy: number;
    communicationClarity: number;
    problemSolving: number;
    culturalAlignment: number;
  };
  keyStrengths: string[];
  growthAreas: string[];
  questionEvaluations: QuestionEvaluation[];
  generatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  type: InterviewType;
  roleTarget: string; // e.g. "Senior Full-Stack Engineer"
  difficulty: InterviewDifficulty;
  status: InterviewStatus;
  startedAt: string;
  completedAt?: string;
  messages: InterviewMessage[];
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: {
    id: string;
    text: string;
    category: string;
    expectedKeyPoints: string[];
    codingProblemId?: string;
  }[];
  report?: InterviewReport;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: {
    python: string;
    javascript: string;
    typescript: string;
    cpp: string;
    java: string;
  };
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
}

export interface ParsedResume {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  candidateName: string;
  candidateEmail: string;
  summary: string;
  experienceYears: number;
  atsScore: number; // 0 - 100
  extractedSkills: string[];
  experienceHighlights: string[];
  education: string[];
  potentialGaps: string[];
  tailoredQuestions: string[];
  rawTextPreview: string;
  sourceType: 'file_upload' | 'pasted_text';
  storedFilePath?: string;
}

export interface TanyaPersonaConfig {
  name: string;
  avatarPreset: 'professional' | 'tech_lead' | 'friendly' | 'executive';
  customAvatarUrl?: string;
  tone: 'supportive' | 'neutral' | 'faang_strict';
  speakingSpeed: number; // 0.8 - 1.2
  voiceName: string; // Kore, Puck, Fenrir, Zephyr
  rigorLevel: 'lenient' | 'standard' | 'rigorous';
  enableFollowUpProbing: boolean;
  welcomeMessage: string;
}

export interface PaymentOrder {
  id: string;
  orderId: string;
  userId: string;
  amount: number; // in INR paise, e.g. 199900 = 1999 INR
  currency: string;
  status: 'created' | 'paid' | 'failed';
  tier: SubscriptionTier;
  createdAt: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actorEmail: string;
  details: string;
}
