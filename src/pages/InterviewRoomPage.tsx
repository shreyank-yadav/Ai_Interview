/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Code2,
  Terminal,
  Volume2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { InterviewSession, InterviewReport, TanyaPersonaConfig, CodingProblem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { TanyaAvatar, TanyaAvatarState } from '../components/TanyaAvatar.tsx';
import { SpeechController } from '../components/SpeechController.tsx';
import { MonacoEditorPanel } from '../components/MonacoEditorPanel.tsx';
import { ReportCardModal } from '../components/ReportCardModal.tsx';

interface InterviewRoomPageProps {
  initialType?: string;
  initialRole?: string;
  initialDifficulty?: string;
  onExit?: () => void;
}

export const InterviewRoomPage: React.FC<InterviewRoomPageProps> = ({
  initialType = 'technical',
  initialRole = 'Senior Full-Stack Engineer',
  initialDifficulty = 'senior',
  onExit,
}) => {
  const { user, refreshUser } = useAuth();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [tanyaState, setTanyaState] = useState<TanyaAvatarState>('idle');
  const [tanyaPersona, setTanyaPersona] = useState<TanyaPersonaConfig | undefined>(undefined);
  const [lastTanyaSpeech, setLastTanyaSpeech] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [codingProblem, setCodingProblem] = useState<CodingProblem | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'conversation' | 'code'>('conversation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // Session elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Initialize or resume interview
  useEffect(() => {
    let isMounted = true;

    const startOrFetchSession = async () => {
      try {
        // Fetch Tanya persona
        const personaRes = await api.getTanyaPersona();
        if (isMounted) setTanyaPersona(personaRes.persona);

        // Fetch problems if DSA track
        if (initialType === 'dsa') {
          const probRes = await api.getProblems();
          if (probRes.problems?.length && isMounted) {
            setCodingProblem(probRes.problems[0]);
          }
        }

        // Create new session
        const res = await api.createInterview({
          type: initialType,
          roleTarget: initialRole,
          difficulty: initialDifficulty,
        });

        if (isMounted) {
          setSession(res.session);
          const firstMsg = res.session.messages.find(m => m.sender === 'tanya');
          if (firstMsg) {
            setLastTanyaSpeech(firstMsg.text);
            setTanyaState('speaking');
            setTimeout(() => setTanyaState('idle'), 4000);
          }
        }
      } catch (err: any) {
        console.error('[InterviewRoom] Init error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Could not start interview session');
        }
      }
    };

    startOrFetchSession();

    return () => {
      isMounted = false;
    };
  }, [initialType, initialRole, initialDifficulty]);

  // Handle Candidate response submission
  const handleAnswerSubmit = async (answerText: string, codeSnippet?: string, language?: string) => {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);
    setTanyaState('thinking');

    try {
      const res = await api.submitAnswer(session.id, answerText, codeSnippet, language);
      setSession(res.session);
      setLastTanyaSpeech(res.tanyaMessage.text);
      setTanyaState('speaking');

      // Refresh credits after answering
      refreshUser();

      // If finished automatically
      if (res.isCompleted) {
        setTimeout(() => setTanyaState('idle'), 5000);
      } else {
        setTimeout(() => setTanyaState('idle'), 4500);
      }
    } catch (err: any) {
      console.error('[InterviewRoom] Answer error:', err);
      setErrorMessage(err.message || 'Error processing response');
      setTanyaState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Finish interview and generate report card
  const handleFinishInterview = async () => {
    if (!session || isFinishing) return;
    setIsFinishing(true);
    setTanyaState('thinking');

    try {
      const res = await api.finishInterview(session.id);
      setSession(res.session);
      setReport(res.report);
      setTanyaState('idle');
    } catch (err: any) {
      console.error('[InterviewRoom] Finish error:', err);
      setErrorMessage(err.message || 'Error compiling evaluation report');
      setTanyaState('idle');
    } finally {
      setIsFinishing(false);
    }
  };

  const currentQ = session?.questions[session.currentQuestionIndex];
  const isDSA = session?.type === 'dsa';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Session Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600/20 border border-indigo-500/30 p-2 text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {session?.roleTarget || initialRole}
              </h1>
              <span className="rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300 uppercase">
                {session?.type || initialType} TRACK
              </span>
            </div>
            <p className="text-xs text-slate-400 capitalize">
              Difficulty: {session?.difficulty || initialDifficulty} &middot; Interviewer: Tanya
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="font-mono font-bold text-white">{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Question progress pill */}
          {session && (
            <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-300">
              <span>Question</span>
              <span className="font-bold text-white">
                {Math.min(session.currentQuestionIndex + 1, session.totalQuestions)}
              </span>
              <span className="text-indigo-400">/ {session.totalQuestions}</span>
            </div>
          )}

          {/* Finish Button */}
          <button
            onClick={handleFinishInterview}
            disabled={isFinishing || !session}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50 cursor-pointer"
          >
            <Award className="h-4 w-4" />
            {isFinishing ? 'Generating Scorecard...' : 'Finish & Evaluate'}
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Interview Area: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tanya Avatar & Persona Profile (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <TanyaAvatar
            state={tanyaState}
            persona={tanyaPersona}
            lastSpokenText={lastTanyaSpeech}
            autoSpeak={true}
          />

          {/* Current Question Focus Card */}
          {currentQ && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Target Competency
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-medium">
                  {currentQ.category}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">{currentQ.text}</p>

              {currentQ.expectedKeyPoints?.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Tanya's Evaluation Rubric:
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    {currentQ.expectedKeyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 mt-0.5">&bull;</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Interaction Arena (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Track Switcher Tab for DSA mode */}
          {isDSA && (
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('conversation')}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'conversation'
                    ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                Discussion & Voice
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'code'
                    ? 'bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Monaco Code Editor & Tests
              </button>
            </div>
          )}

          {/* Coding Editor (Active when on DSA and code tab) */}
          {isDSA && activeTab === 'code' ? (
            <div className="h-[550px]">
              <MonacoEditorPanel
                problem={codingProblem}
                onSubmitCode={(code, lang) => {
                  handleAnswerSubmit(
                    `I have submitted my implementation in ${lang} and verified the test cases.`,
                    code,
                    lang
                  );
                  setActiveTab('conversation');
                }}
              />
            </div>
          ) : (
            /* Conversation Transcript Stream */
            <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl min-h-[460px] max-h-[520px]">
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                {session?.messages.map((m, idx) => {
                  const isTanya = m.sender === 'tanya';
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        isTanya ? 'items-start' : 'items-start justify-end'
                      }`}
                    >
                      {isTanya && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold">
                          T
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-3.5 max-w-[85%] ${
                          isTanya
                            ? 'border border-slate-800 bg-slate-900 text-slate-100 shadow-sm'
                            : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isTanya ? 'text-indigo-400' : 'text-indigo-200'
                            }`}
                          >
                            {isTanya ? 'Tanya (Interviewer)' : 'You'}
                          </span>
                          <span className={`text-[10px] ${isTanya ? 'text-slate-500' : 'text-indigo-200'}`}>
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap">{m.text}</p>

                        {m.codeSnippet && (
                          <div className="mt-2.5 rounded-lg bg-slate-950/90 p-2.5 font-mono text-[11px] border border-slate-800">
                            <span className="text-[10px] uppercase text-indigo-400 font-bold block mb-1">
                              Submitted {m.language || 'Code'}:
                            </span>
                            <pre className="text-slate-200 whitespace-pre-wrap overflow-x-auto">
                              {m.codeSnippet}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Speech & Text Controller Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <SpeechController
                  onSendMessage={text => handleAnswerSubmit(text)}
                  disabled={isSubmitting || session?.status === 'completed'}
                  onListeningStateChange={isListening => {
                    setTanyaState(isListening ? 'listening' : 'idle');
                  }}
                  placeholder="Answer with your microphone, or type your structured thoughts here..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Final Comprehensive Report Modal */}
      {report && (
        <ReportCardModal
          report={report}
          onClose={() => {
            setReport(null);
            onExit?.();
          }}
          onStartNew={() => {
            setReport(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
