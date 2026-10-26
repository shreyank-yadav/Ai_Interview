/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.ts';
import { extractUserIdFromHeader } from './authRoutes.ts';
import { InterviewSession, InterviewMessage, InterviewType, InterviewDifficulty } from '../db/schema.ts';
import { generateTanyaNextQuestion, generateInterviewReportCard } from '../services/geminiService.ts';

const router = Router();

// Standard question templates by track
const DEFAULT_QUESTIONS: Record<InterviewType, { text: string; category: string; expectedKeyPoints: string[] }[]> = {
  hr: [
    {
      text: "Tell me about yourself, your recent professional journey, and what made you interested in this role?",
      category: "Introduction & Career Narrative",
      expectedKeyPoints: ["Elevator pitch", "Key milestones", "Alignment with company mission"],
    },
    {
      text: "Can you describe a high-stakes disagreement you had with a tech lead or product manager, and how you resolved it without compromising the team velocity?",
      category: "Conflict Resolution & Collaboration",
      expectedKeyPoints: ["Situation and context", "Active listening and empathy", "Data-driven resolution"],
    },
    {
      text: "Tell me about a project that failed or missed its delivery deadline. What happened, how did you communicate to stakeholders, and what was your takeaway?",
      category: "Accountability & Post-Mortem Thinking",
      expectedKeyPoints: ["Ownership without blaming others", "Proactive mitigation", "Systemic improvements"],
    },
  ],
  technical: [
    {
      text: "How would you design a distributed rate limiter that handles 100,000 requests per second across multiple regional data centers?",
      category: "System Design & Distributed Scalability",
      expectedKeyPoints: ["Token bucket / Leaky bucket algorithm", "Redis or Memcached caching", "Sliding window log", "Race condition mitigation"],
    },
    {
      text: "What are the trade-offs between SQL (e.g., PostgreSQL) and NoSQL (e.g., DynamoDB/MongoDB) when designing an e-commerce order ledger?",
      category: "Data Modeling & Concurrency",
      expectedKeyPoints: ["ACID transactions", "CAP theorem trade-offs", "Schema evolution", "Eventual consistency vs strong consistency"],
    },
    {
      text: "How do you identify, measure, and optimize memory leaks and event-loop lag in a high-concurrency Node.js or Go microservice?",
      category: "Performance Tuning & Diagnostics",
      expectedKeyPoints: ["Profiling tools (heap snapshots, flame graphs)", "Garbage collection behavior", "Async resource leak tracking"],
    },
  ],
  resume: [
    {
      text: "Looking at your resume, you spearheaded a major infrastructure optimization. Could you explain the architectural bottleneck you identified and the quantitative results?",
      category: "Resume Deep Dive - System Architecture",
      expectedKeyPoints: ["Baseline metrics before refactoring", "Technical architecture chosen", "Measurable outcomes achieved"],
    },
    {
      text: "You listed microservices and event-driven architecture on your profile. How did you handle distributed saga patterns, rollback compensations, and idempotency?",
      category: "Resume Deep Dive - Distributed Workflows",
      expectedKeyPoints: ["Saga orchestrator vs choreography", "Compensating transactions", "Idempotency keys"],
    },
    {
      text: "What was the most difficult architectural tradeoff you made in your recent position where you had to compromise on technical perfection for shipping speed?",
      category: "Resume Deep Dive - Engineering Pragmatism",
      expectedKeyPoints: ["Deliberate technical debt management", "Risk assessment", "Follow-up refactoring plan"],
    },
  ],
  dsa: [
    {
      text: "Let's work through an algorithmic challenge. Please check the coding editor on your right. First, clarify the problem constraints, describe your approach out loud, and state your expected Time and Space complexity before writing code.",
      category: "Algorithmic Problem Solving",
      expectedKeyPoints: ["Constraint clarification", "Brute-force vs optimal approach", "Big-O time and space analysis"],
    },
    {
      text: "Now implement your solution in the code editor, run the provided test cases, and explain how you handle edge cases such as empty inputs or negative values.",
      category: "Code Implementation & Verification",
      expectedKeyPoints: ["Syntactically valid implementation", "Clean variable naming", "Edge case coverage"],
    },
    {
      text: "Can you analyze how your algorithm performs if the input dataset is streamed continuously and cannot fit into system RAM?",
      category: "Scale & Streaming Adaptation",
      expectedKeyPoints: ["External sorting / Reservoir sampling", "Streaming sliding window", "Space complexity constraints"],
    },
  ],
};

// GET /api/interviews
router.get('/', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sessions = dbStore.getUserSessions(userId);
  return res.json({ sessions });
});

// POST /api/interviews/create
router.post('/create', (req: Request, res: Response): any => {
  const userId = extractUserIdFromHeader(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = dbStore.findUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check subscription quota
  if (user.subscriptionTier !== 'premium' && user.interviewCreditsRemaining <= 0) {
    return res.status(403).json({
      error: 'You have used all free interview credits. Upgrade to Premium for unlimited AI mock interviews with Tanya!',
      needsUpgrade: true,
    });
  }

  const { type = 'technical', roleTarget = 'Senior Full-Stack Engineer', difficulty = 'mid', resumeId, problemId } = req.body;
  const persona = dbStore.getTanyaPersona();

  // Deduct 1 credit for free tier
  if (user.subscriptionTier !== 'premium') {
    dbStore.updateUser(user.id, {
      interviewCreditsRemaining: Math.max(0, user.interviewCreditsRemaining - 1),
    });
  }

  let questions = [...(DEFAULT_QUESTIONS[type as InterviewType] || DEFAULT_QUESTIONS.technical)];

  // If resume track and resume provided, incorporate tailored questions
  if (type === 'resume' && resumeId) {
    const resume = dbStore.getResumeById(resumeId);
    if (resume && resume.tailoredQuestions?.length) {
      questions = resume.tailoredQuestions.map((q, idx) => ({
        text: q,
        category: `Resume Analysis - Question ${idx + 1}`,
        expectedKeyPoints: ['Demonstrate hands-on experience', 'Provide measurable metrics', 'Explain trade-offs'],
      }));
    }
  }

  // If DSA track, attach coding problem
  let codingProblemId = problemId;
  if (type === 'dsa' && !codingProblemId) {
    const problems = dbStore.getProblems();
    if (problems.length > 0) {
      codingProblemId = problems[0].id;
    }
  }

  const formattedQuestions = questions.map((q, i) => ({
    id: `q_${i + 1}`,
    text: q.text,
    category: q.category,
    expectedKeyPoints: q.expectedKeyPoints,
    codingProblemId: type === 'dsa' ? codingProblemId : undefined,
  }));

  const initialWelcome = `${persona.welcomeMessage} We'll be conducting a ${difficulty}-level ${type.toUpperCase()} interview for the ${roleTarget} role. First question: ${formattedQuestions[0].text}`;

  const session: InterviewSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    type: type as InterviewType,
    roleTarget,
    difficulty: difficulty as InterviewDifficulty,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        sender: 'tanya',
        text: initialWelcome,
        timestamp: new Date().toISOString(),
      },
    ],
    currentQuestionIndex: 0,
    totalQuestions: formattedQuestions.length,
    questions: formattedQuestions,
  };

  dbStore.createSession(session);
  return res.status(201).json({ session });
});

// GET /api/interviews/:id
router.get('/:id', (req: Request, res: Response): any => {
  const session = dbStore.getSessionById(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Interview session not found' });
  }
  return res.json({ session });
});

// POST /api/interviews/:id/answer
router.post('/:id/answer', async (req: Request, res: Response): Promise<any> => {
  const session = dbStore.getSessionById(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  if (session.status === 'completed') {
    return res.status(400).json({ error: 'This interview session is already completed' });
  }

  const { answer, codeSnippet, language } = req.body;
  if (!answer && !codeSnippet) {
    return res.status(400).json({ error: 'Answer content is required' });
  }

  // Record candidate message
  const candidateMsg: InterviewMessage = {
    id: `msg_cand_${Date.now()}`,
    sender: 'candidate',
    text: answer || 'Code submission provided in editor.',
    codeSnippet,
    language,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(candidateMsg);

  const currentQ = session.questions[session.currentQuestionIndex];
  const persona = dbStore.getTanyaPersona();

  // Generate Tanya adaptive response using Gemini
  const tanyaEvaluation = await generateTanyaNextQuestion({
    persona,
    interviewType: session.type,
    roleTarget: session.roleTarget,
    difficulty: session.difficulty,
    currentQuestion: currentQ ? currentQ.text : 'General question',
    candidateAnswer: answer || codeSnippet || '',
    questionNumber: session.currentQuestionIndex + 1,
    totalQuestions: session.totalQuestions,
  });

  const nextIndex = session.currentQuestionIndex + 1;
  const isFinalQuestion = nextIndex >= session.totalQuestions;

  let tanyaReplyText = '';
  if (isFinalQuestion) {
    tanyaReplyText = `${tanyaEvaluation.acknowledgment} ${tanyaEvaluation.quickFeedback} That concludes all our structured questions for this session! Click 'Finish Interview & Generate Scorecard' to review your detailed performance evaluation and recommendations.`;
  } else {
    session.currentQuestionIndex = nextIndex;
    const nextQ = session.questions[nextIndex]?.text || tanyaEvaluation.nextQuestion;
    tanyaReplyText = `${tanyaEvaluation.acknowledgment} ${tanyaEvaluation.quickFeedback} Next question: ${nextQ}`;
  }

  const tanyaMsg: InterviewMessage = {
    id: `msg_tanya_${Date.now()}`,
    sender: 'tanya',
    text: tanyaReplyText,
    timestamp: new Date().toISOString(),
  };
  session.messages.push(tanyaMsg);

  dbStore.updateSession(session.id, {
    messages: session.messages,
    currentQuestionIndex: session.currentQuestionIndex,
  });

  return res.json({
    session,
    tanyaMessage: tanyaMsg,
    isCompleted: isFinalQuestion,
    quickFeedback: tanyaEvaluation.quickFeedback,
  });
});

// POST /api/interviews/:id/finish
router.post('/:id/finish', async (req: Request, res: Response): Promise<any> => {
  const session = dbStore.getSessionById(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  // Extract Q&A pairs
  const qaPairs: { question: string; answer: string; category?: string }[] = [];
  const msgs = session.messages;

  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].sender === 'tanya' && i + 1 < msgs.length && msgs[i + 1].sender === 'candidate') {
      qaPairs.push({
        question: msgs[i].text,
        answer: msgs[i + 1].text + (msgs[i + 1].codeSnippet ? `\nCode:\n${msgs[i + 1].codeSnippet}` : ''),
      });
    }
  }

  // Generate Report Card
  const reportData = await generateInterviewReportCard({
    interviewType: session.type,
    roleTarget: session.roleTarget,
    difficulty: session.difficulty,
    qaPairs,
  });

  const report = dbStore.saveReport({
    id: `report_${Date.now()}`,
    sessionId: session.id,
    overallScore: reportData.overallScore,
    recommendation: reportData.recommendation,
    summary: reportData.summary,
    categoryScores: reportData.categoryScores,
    keyStrengths: reportData.keyStrengths,
    growthAreas: reportData.growthAreas,
    questionEvaluations: reportData.questionEvaluations,
    generatedAt: new Date().toISOString(),
  });

  return res.json({ session: dbStore.getSessionById(session.id), report });
});

export default router;
