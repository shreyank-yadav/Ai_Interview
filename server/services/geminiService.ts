/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { QuestionEvaluation, InterviewReport, TanyaPersonaConfig, ParsedResume } from '../db/schema.ts';

// Initialize Gemini Client strictly following the Gemini API Skill guidelines
const apiKey = process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.warn(
    '[Gemini Service] Warning: GEMINI_API_KEY environment variable is not configured. Real-time AI reasoning, parsing, and TTS will utilize structured fallback handlers.'
  );
}

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Issue 6: Dynamic model environment variable reads with documented defaults
export const DEFAULT_MODEL = (process.env.GEMINI_MODEL_TEXT && process.env.GEMINI_MODEL_TEXT.trim()) || 'gemini-3.8-flash';
export const TTS_MODEL = (process.env.GEMINI_MODEL_TTS && process.env.GEMINI_MODEL_TTS.trim()) || 'gemini-3.8-flash-lite-tts';

/**
 * Timeout wrapper for remote Gemini API calls to ensure responsive fallbacks during network spikes
 */
async function callGeminiWithTimeout<T>(apiPromise: Promise<T>, timeoutMs: number = 4000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini API call exceeded ${timeoutMs}ms timeout`)), timeoutMs)
  );
  return Promise.race([apiPromise, timeout]);
}

/**
 * Generate adaptive interview follow-up or next question based on candidate's answer
 */
export async function generateTanyaNextQuestion(params: {
  persona: TanyaPersonaConfig;
  interviewType: string;
  roleTarget: string;
  difficulty: string;
  currentQuestion: string;
  candidateAnswer: string;
  questionNumber: number;
  totalQuestions: number;
}): Promise<{
  acknowledgment: string;
  nextQuestion: string;
  quickFeedback: string;
}> {
  if (!ai) {
    return getFallbackNextQuestion(params);
  }

  const systemInstruction = `You are Tanya, an expert AI interviewer conducting a professional ${params.difficulty}-level ${params.interviewType} interview for the position: ${params.roleTarget}.
Persona Tone: ${params.persona.tone} (e.g. supportive = encouraging mentor; neutral = objective corporate assessor; faang_strict = rigorous bar raiser).
Rigor Level: ${params.persona.rigorLevel}.
You are currently on Question ${params.questionNumber} of ${params.totalQuestions}.

Evaluate the candidate's answer. Give a natural, conversational 1-sentence acknowledgment with quick feedback, followed by either an adaptive deep-dive probing question or the next structured question.
Return strictly valid JSON matching the requested schema.`;

  const prompt = `Current Question: "${params.currentQuestion}"
Candidate Answer: "${params.candidateAnswer}"

Analyze the depth, accuracy, and completeness of the answer. Provide:
1. acknowledgment: natural transition sentence from Tanya acknowledging what the candidate said.
2. quickFeedback: 1 concise tip or observation about their answer.
3. nextQuestion: the subsequent question (or drill-down probing question).`;

  try {
    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              acknowledgment: { type: Type.STRING },
              quickFeedback: { type: Type.STRING },
              nextQuestion: { type: Type.STRING },
            },
            required: ['acknowledgment', 'quickFeedback', 'nextQuestion'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return {
      acknowledgment: parsed.acknowledgment || "Thank you for sharing that perspective.",
      quickFeedback: parsed.quickFeedback || "Clear points noted on the architectural approach.",
      nextQuestion: parsed.nextQuestion || "Let's move to our next core topic.",
    };
  } catch (error) {
    console.warn('[Gemini API] Question generation fallback engaged:', error);
    return getFallbackNextQuestion(params);
  }
}

/**
 * Generate full evaluation report card for an interview session
 */
export async function generateInterviewReportCard(params: {
  interviewType: string;
  roleTarget: string;
  difficulty: string;
  qaPairs: { question: string; answer: string; category?: string }[];
}): Promise<{
  overallScore: number;
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
}> {
  if (!ai || params.qaPairs.length === 0) {
    return getFallbackReportCard(params);
  }

  const prompt = `Act as Tanya, the Principal Interviewer evaluating a candidate for ${params.roleTarget} (${params.difficulty} level, ${params.interviewType} track).
Review the complete transcript of Q&A pairs:
${JSON.stringify(params.qaPairs, null, 2)}

Provide a rigorous, unbiased assessment including overall score (0-100), hire recommendation ('Strong Hire', 'Hire', 'Lean Hire', 'No Hire'), 4 category scores (0-100 each), top 3 key strengths, top 2-3 growth areas, and individual evaluations for each question.`;

  try {
    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              recommendation: { type: Type.STRING },
              summary: { type: Type.STRING },
              categoryScores: {
                type: Type.OBJECT,
                properties: {
                  technicalAccuracy: { type: Type.NUMBER },
                  communicationClarity: { type: Type.NUMBER },
                  problemSolving: { type: Type.NUMBER },
                  culturalAlignment: { type: Type.NUMBER },
                },
                required: ['technicalAccuracy', 'communicationClarity', 'problemSolving', 'culturalAlignment'],
              },
              keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              growthAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
              questionEvaluations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionId: { type: Type.STRING },
                    questionText: { type: Type.STRING },
                    candidateAnswer: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    clarityScore: { type: Type.NUMBER },
                    technicalAccuracyScore: { type: Type.NUMBER },
                    depthScore: { type: Type.NUMBER },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                    idealAnswer: { type: Type.STRING },
                  },
                  required: ['questionText', 'candidateAnswer', 'score', 'idealAnswer'],
                },
              },
            },
            required: ['overallScore', 'recommendation', 'summary', 'categoryScores', 'keyStrengths', 'growthAreas', 'questionEvaluations'],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{}');
    return {
      overallScore: Math.min(100, Math.max(0, Math.round(parsed.overallScore || 75))),
      recommendation: (['Strong Hire', 'Hire', 'Lean Hire', 'No Hire'].includes(parsed.recommendation)
        ? parsed.recommendation
        : 'Hire') as any,
      summary: parsed.summary || 'Candidate demonstrated competent foundational knowledge across tested domains.',
      categoryScores: {
        technicalAccuracy: Math.round(parsed.categoryScores?.technicalAccuracy || 75),
        communicationClarity: Math.round(parsed.categoryScores?.communicationClarity || 80),
        problemSolving: Math.round(parsed.categoryScores?.problemSolving || 70),
        culturalAlignment: Math.round(parsed.categoryScores?.culturalAlignment || 80),
      },
      keyStrengths: parsed.keyStrengths || ['Solid foundational concepts', 'Clear structured articulation'],
      growthAreas: parsed.growthAreas || ['Provide more concrete production metrics', 'Address edge cases early'],
      questionEvaluations: (parsed.questionEvaluations || []).map((q: any, i: number) => ({
        questionId: q.questionId || `eval_q_${i + 1}`,
        questionText: q.questionText || params.qaPairs[i]?.question || '',
        candidateAnswer: q.candidateAnswer || params.qaPairs[i]?.answer || '',
        score: Math.round(q.score || 75),
        clarityScore: Math.round(q.clarityScore || 80),
        technicalAccuracyScore: Math.round(q.technicalAccuracyScore || 75),
        depthScore: Math.round(q.depthScore || 70),
        strengths: q.strengths || ['Good structure'],
        improvements: q.improvements || ['Could be more comprehensive'],
        idealAnswer: q.idealAnswer || 'A top-tier answer addresses technical depth, real-world constraints, and measurable impact.',
      })),
    };
  } catch (error) {
    console.warn('[Gemini API] Report generation fallback engaged:', error);
    return getFallbackReportCard(params);
  }
}

/**
 * Parse resume text and extract structured ATS insights
 */
export async function parseResumeWithGemini(
  resumeText: string,
  fileName: string
): Promise<Omit<ParsedResume, 'id' | 'userId' | 'fileSize' | 'uploadedAt' | 'sourceType' | 'storedFilePath'>> {
  if (!ai) {
    return getFallbackResumeAnalysis(resumeText, fileName);
  }

  const prompt = `Analyze this candidate resume for ATS compatibility and technical hiring evaluation:
Filename: ${fileName}
Content:
"""
${resumeText.slice(0, 10000)}
"""

Extract structured data: candidateName, candidateEmail, professional summary, estimated years of experience, ATS compatibility score (0-100), technical and soft skills list, key highlights, education summary, potential gaps or missing items, and 3-5 personalized Tanya interview questions targeting their specific claims.`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            candidateEmail: { type: Type.STRING },
            summary: { type: Type.STRING },
            experienceYears: { type: Type.NUMBER },
            atsScore: { type: Type.NUMBER },
            extractedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experienceHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            education: { type: Type.ARRAY, items: { type: Type.STRING } },
            potentialGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            tailoredQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['candidateName', 'atsScore', 'extractedSkills', 'tailoredQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      fileName,
      candidateName: parsed.candidateName || 'Candidate',
      candidateEmail: parsed.candidateEmail || 'candidate@example.com',
      summary: parsed.summary || 'Experienced engineering professional with proven software delivery track record.',
      experienceYears: Math.round(parsed.experienceYears || 4),
      atsScore: Math.min(100, Math.max(30, Math.round(parsed.atsScore || 82))),
      extractedSkills: parsed.extractedSkills || ['Software Engineering', 'System Design', 'Problem Solving'],
      experienceHighlights: parsed.experienceHighlights || ['Delivered critical user-facing features on schedule.'],
      education: parsed.education || ['Degree in Computer Science or related field'],
      potentialGaps: parsed.potentialGaps || ['Could include more quantified business outcomes (e.g. % performance increase)'],
      tailoredQuestions: parsed.tailoredQuestions || [
        'Could you deep-dive into your most technically challenging project and the architectural hurdles you overcame?',
        'How do you approach automated testing and continuous integration in your typical workflow?'
      ],
      rawTextPreview: resumeText.slice(0, 400),
    };
  } catch (error) {
    console.warn('[Gemini API] Resume parsing fallback engaged:', error);
    return getFallbackResumeAnalysis(resumeText, fileName);
  }
}

/**
 * Generate speech WAV audio via Gemini gemini-3.8-flash-lite-tts
 */
export async function generateTanyaVoiceAudio(text: string, voiceName: string = 'Kore'): Promise<Buffer | null> {
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Professional, articulate technical interviewer',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return Buffer.from(base64Audio, 'base64');
    }
  } catch (error) {
    console.warn('[Gemini TTS] Voice generation fallback to browser speech synthesis:', error);
  }
  return null;
}

// ================= Fallback Helpers =================

function getFallbackNextQuestion(params: {
  interviewType: string;
  roleTarget: string;
  difficulty: string;
  currentQuestion: string;
  candidateAnswer: string;
  questionNumber: number;
  totalQuestions: number;
}) {
  const followUps: Record<string, string[]> = {
    hr: [
      "How did you handle pushback or conflicting priorities from stakeholders in that scenario?",
      "Looking back, what is one thing you would execute differently if faced with the exact same situation?",
      "How did you align the team's long-term morale with the aggressive deadlines you were facing?",
    ],
    technical: [
      "What are the failure modes of that architecture if network partitions occur across availability zones?",
      "How would you measure the p99 latency impact and handle cache invalidation at scale?",
      "Walk me through the database indexing strategy and query execution plan for that workload.",
    ],
    dsa: [
      "Can we optimize the space complexity further from O(N) to O(1) in-place?",
      "What edge cases might trigger stack overflows or integer overflows in your solution?",
      "How does your algorithm behave with duplicate values or an already sorted array?",
    ],
    resume: [
      "Could you quantify the business outcome or user retention impact of that implementation?",
      "What technical tradeoffs did you evaluate before settling on your chosen tech stack?",
      "How did you onboard other team members to maintain that subsystem effectively?",
    ],
  };

  const pool = followUps[params.interviewType] || followUps.technical;
  const nextQ = pool[(params.questionNumber - 1) % pool.length];

  return {
    acknowledgment: "Thank you for detailing that approach.",
    quickFeedback: "Good structured communication with relevant technical highlights.",
    nextQuestion: nextQ,
  };
}

function getFallbackReportCard(params: {
  interviewType: string;
  roleTarget: string;
  difficulty: string;
  qaPairs: { question: string; answer: string; category?: string }[];
}) {
  const totalLength = params.qaPairs.reduce((acc, q) => acc + (q.answer?.length || 0), 0);
  const avgLen = params.qaPairs.length > 0 ? totalLength / params.qaPairs.length : 0;
  const score = Math.min(95, Math.max(65, Math.round(72 + (avgLen > 100 ? 15 : avgLen / 10))));

  return {
    overallScore: score,
    recommendation: (score >= 85 ? 'Strong Hire' : score >= 75 ? 'Hire' : 'Lean Hire') as any,
    summary: `Candidate demonstrated solid understanding of ${params.roleTarget} fundamentals with structured reasoning across all interview phases.`,
    categoryScores: {
      technicalAccuracy: score,
      communicationClarity: score + 2,
      problemSolving: score - 3,
      culturalAlignment: score + 4,
    },
    keyStrengths: [
      'Logical step-by-step problem deconstruction.',
      'Active consideration of operational constraints.',
      'Clear, articulate responses without unwarranted jargon.',
    ],
    growthAreas: [
      'Proactively state Big-O tradeoffs before committing to an implementation.',
      'Incorporate concrete production metrics and observability strategies.',
    ],
    questionEvaluations: params.qaPairs.map((qa, i) => ({
      questionId: `eval_${i + 1}`,
      questionText: qa.question,
      candidateAnswer: qa.answer,
      score: score,
      clarityScore: score + 2,
      technicalAccuracyScore: score,
      depthScore: score - 2,
      strengths: ['Identified primary requirements clearly and structured the answer logically.'],
      improvements: ['Could elaborate on disaster recovery and failover edge cases.'],
      idealAnswer: 'A benchmark response covers trade-offs, scalability constraints, operational telemetry, and quantitative outcomes.',
    })),
  };
}

function getFallbackResumeAnalysis(resumeText: string, fileName: string) {
  const skillsList = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
    'SQL', 'Git', 'REST APIs', 'Docker', 'AWS', 'System Design'
  ].filter(skill => resumeText.toLowerCase().includes(skill.toLowerCase()));

  const finalSkills = skillsList.length > 2 ? skillsList : ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'];

  return {
    fileName,
    candidateName: 'Experienced Candidate',
    candidateEmail: 'candidate@example.com',
    summary: 'Skilled software practitioner with demonstrable background in modern web technologies, backend architectures, and agile delivery.',
    experienceYears: 5,
    atsScore: 84,
    extractedSkills: finalSkills,
    experienceHighlights: [
      'Designed and shipped reliable distributed services with CI/CD integration.',
      'Optimized query performance and reduced API response latencies.',
      'Collaborated cross-functionally across product, design, and engineering teams.'
    ],
    education: ['B.S. in Computer Science or Equivalent Technical Experience'],
    potentialGaps: [
      'Quantify business impacts with clear metrics (e.g., % latency reduced, $ server costs saved).',
      'Detail automated test coverage frameworks utilized in previous roles.'
    ],
    tailoredQuestions: [
      'I noticed your experience with distributed systems. How do you handle idempotency and retry storms during network timeouts?',
      'Can you discuss an instance where you had to refactor a legacy module to improve maintainability?',
      'What observability metrics do you prioritize when triaging production incidents?'
    ],
    rawTextPreview: resumeText.slice(0, 400),
  };
}
