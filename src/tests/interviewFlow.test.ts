/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dbStore } from '../../server/db/store.ts';
import { generateInterviewReportCard } from '../../server/services/geminiService.ts';

export async function runInterviewFlowTests(): Promise<{ passed: boolean; message: string }> {
  console.log('--- Testing Interview Lifecycle & Scorecard Generation ---');

  // 1. Verify User store lookup
  const candidate = dbStore.findUserByEmail('candidate@tanya-ai.com');
  if (!candidate) {
    throw new Error('Seed candidate not found in database store!');
  }
  console.log(`✓ Candidate user verified: ${candidate.name} (${candidate.subscriptionTier})`);

  // 2. Scorecard Generation test
  const sampleQA = [
    {
      question: 'How do you guarantee idempotency in a distributed payment system?',
      answer: 'I use UUIDv4 idempotency keys, an atomic Redis lock with 120s TTL, and a unique constraint on PostgreSQL order table.',
    },
    {
      question: 'Explain optimistic concurrency control vs pessimistic locking.',
      answer: 'Optimistic uses version columns or ETags and checks on write; pessimistic uses SELECT FOR UPDATE which holds row locks.',
    },
  ];

  const report = await generateInterviewReportCard({
    interviewType: 'technical',
    roleTarget: 'Senior Backend Engineer',
    difficulty: 'senior',
    qaPairs: sampleQA,
  });

  if (!report.overallScore || report.overallScore < 0 || report.overallScore > 100) {
    throw new Error(`Invalid overall score produced: ${report.overallScore}`);
  }

  if (!report.categoryScores.technicalAccuracy || !report.recommendation) {
    throw new Error('Missing category scores or hiring recommendation in report card!');
  }

  console.log(`✓ Report card generated successfully: Score ${report.overallScore}/100, Verdict: ${report.recommendation}`);

  return { passed: true, message: 'Interview lifecycle & report tests passed!' };
}
