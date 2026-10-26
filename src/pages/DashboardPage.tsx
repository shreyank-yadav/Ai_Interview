/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Sparkles,
  Award,
  Clock,
  ArrowRight,
  Code2,
  Users,
  FileText,
  BrainCircuit,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { InterviewSession, InterviewReport, ParsedResume } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ReportCardModal } from '../components/ReportCardModal.tsx';

interface DashboardPageProps {
  onStartInterview: (type: string, roleTarget?: string, difficulty?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onStartInterview, onNavigateTab }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [selectedReport, setSelectedReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [intRes, resRes] = await Promise.all([api.getInterviews(), api.getResumes()]);
        setSessions(intRes.sessions || []);
        setResumes(resRes.resumes || []);
      } catch (err) {
        console.warn('[Dashboard] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedSessions = sessions.filter(s => s.status === 'completed' && s.report);
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.report?.overallScore || 0), 0) /
            completedSessions.length
        )
      : 0;

  const hireRate =
    completedSessions.length > 0
      ? Math.round(
          (completedSessions.filter(
            s => s.report?.recommendation === 'Strong Hire' || s.report?.recommendation === 'Hire'
          ).length /
            completedSessions.length) *
            100
        )
      : 0;

  const interviewTracks = [
    {
      id: 'technical',
      title: 'Technical & System Design',
      desc: 'Distributed systems, architecture tradeoffs, microservices, and concurrency.',
      icon: BrainCircuit,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30',
      difficulty: 'senior',
    },
    {
      id: 'dsa',
      title: 'DSA & Coding Arena',
      desc: 'Live algorithmic problem solving in Monaco editor with runtime test cases.',
      icon: Code2,
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
      difficulty: 'mid',
    },
    {
      id: 'resume',
      title: 'Resume-Tailored Deep Dive',
      desc: "Tanya grills you on the specific claims, tech stacks, and metrics in your resume.",
      icon: FileText,
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30',
      difficulty: 'senior',
    },
    {
      id: 'hr',
      title: 'Behavioral & Leadership',
      desc: 'STAR framework, conflict resolution, executive communication, and team culture.',
      icon: Users,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
      difficulty: 'mid',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Platform Branding & Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-xs font-bold text-indigo-300">
                PrepNova — AI-Powered Interview Preparation Platform
              </span>
              <span className="text-xs text-slate-400">&bull; Tanya Engine v2.4</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Candidate'}!
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Elevate your interview performance with PrepNova. Prepare with Tanya across technical depth, live coding challenges, and behavioral storytelling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartInterview('technical', 'Senior Full-Stack Engineer', 'senior')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition"
            >
              <Sparkles className="h-4 w-4" />
              Quick Launch: Tech Interview
            </button>
            <button
              onClick={() => onNavigateTab('resume')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <FileText className="h-4 w-4" />
              Upload Resume
            </button>
          </div>
        </div>
      </div>

      {/* Meet Tanya — Your Personal AI Interviewer Section */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left max-w-2xl">
            {/* Tanya Avatar Portrait Frame */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20">
                <img
                  src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&auto=format&fit=crop&q=80"
                  alt="Tanya - Your Personal AI Interviewer"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Meet Tanya
              </h2>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Your Personal AI Interviewer
              </p>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Practice real-world interviews, improve your answers, solve coding problems, and receive personalized feedback with Tanya.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onStartInterview('technical', 'Senior Full-Stack Engineer', 'senior')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition"
            >
              <Sparkles className="h-4 w-4" />
              Interview with Tanya
            </button>
            <button
              onClick={() => onStartInterview('dsa', 'Algorithms & Problem Solving', 'mid')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              <Code2 className="h-4 w-4" />
              Coding Arena
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Score</span>
            <Award className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{avgScore || '--'}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Based on completed sessions</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Hire Recommendation</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{hireRate}%</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Pass rate by Tanya</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Interviews Taken</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{completedSessions.length}</span>
            <span className="text-xs text-slate-400">sessions</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Detailed reports saved</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Plan & Credits</span>
            <Zap className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400">
              {user?.subscriptionTier === 'premium' ? 'PRO' : `${user?.interviewCreditsRemaining || 0} Left`}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('pricing')}
            className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1"
          >
            {user?.subscriptionTier === 'premium' ? 'Manage Subscription' : 'Upgrade to Unlimited'}
          </button>
        </div>
      </div>

      {/* Start Interview Tracks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Interview Tracks with Tanya</h2>
            <p className="text-xs text-slate-400">Select an assessment type to launch an interactive session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviewTracks.map(track => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700 hover:bg-slate-900/80 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-tr ${track.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 capitalize">
                      {track.difficulty} Level
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {track.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{track.desc}</p>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/60">
                  <span className="text-xs text-slate-500">Duration: ~15-20 mins</span>
                  <button
                    onClick={() => onStartInterview(track.id, 'Senior Software Engineer', track.difficulty)}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition group-hover:translate-x-1 duration-150"
                  >
                    Start Interview
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Interviews Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Interview Sessions</h3>
            <p className="text-xs text-slate-400">Review your past performance, Tanya's critique, and benchmark answers</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
            <p className="text-xs text-slate-400">No interviews completed yet.</p>
            <button
              onClick={() => onStartInterview('technical', 'Senior Full-Stack Engineer', 'senior')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white"
            >
              Start First Interview
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">Role & Track</th>
                  <th className="pb-3">Difficulty</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Verdict</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 pl-2 font-medium text-white">
                      <div>{s.roleTarget}</div>
                      <span className="text-[10px] text-indigo-400 uppercase font-semibold">{s.type} Track</span>
                    </td>
                    <td className="py-3.5 capitalize text-slate-300">{s.difficulty}</td>
                    <td className="py-3.5 text-slate-400">
                      {new Date(s.startedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 font-bold">
                      {s.report ? (
                        <span className="text-indigo-400">{s.report.overallScore} / 100</span>
                      ) : (
                        <span className="text-slate-500">In Progress</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      {s.report ? (
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                            s.report.recommendation.includes('Hire')
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {s.report.recommendation}
                        </span>
                      ) : (
                        <span className="text-slate-500">Incomplete</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {s.report ? (
                        <button
                          onClick={() => setSelectedReport(s.report!)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        >
                          View Scorecard
                        </button>
                      ) : (
                        <button
                          onClick={() => onStartInterview(s.type, s.roleTarget, s.difficulty)}
                          className="rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 text-xs font-semibold hover:bg-indigo-600/30 transition"
                        >
                          Resume
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scorecard Modal */}
      {selectedReport && (
        <ReportCardModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStartNew={() => onStartInterview('technical', 'Senior Full-Stack Engineer', 'senior')}
        />
      )}
    </div>
  );
};
