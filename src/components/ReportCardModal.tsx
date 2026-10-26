/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Award,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  TrendingUp,
  Brain,
  MessageSquare,
  Users,
} from 'lucide-react';
import { InterviewReport } from '../types/index.ts';

interface ReportCardModalProps {
  report: InterviewReport;
  onClose: () => void;
  onStartNew?: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  report,
  onClose,
  onStartNew,
}) => {
  useEffect(() => {
    if (report.overallScore >= 75) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [report.overallScore]);

  const handlePrint = () => {
    window.print();
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Hire':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'Lean Hire':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tanya AI &mdash; Candidate Evaluation Report</h2>
              <p className="text-xs text-slate-400">Official Performance Scorecard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition print:hidden"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition print:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-extrabold text-3xl shadow-inner">
                {report.overallScore}
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Overall Score</span>
                <p className="text-sm text-slate-300">Out of 100 benchmark points</p>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Hiring Decision</span>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1 text-sm font-bold ${getRecommendationBadge(
                    report.recommendation
                  )}`}
                >
                  <Sparkles className="h-4 w-4" />
                  {report.recommendation}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Generated At</span>
              <p className="text-xs text-slate-300">{new Date(report.generatedAt).toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-1">Evaluated by Tanya AI Core Engine</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Executive Summary</h3>
            <p className="text-sm text-slate-200 leading-relaxed">{report.summary}</p>
          </div>

          {/* 4 Pillars Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Core Competencies</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Brain className="h-3.5 w-3.5 text-indigo-400" />
                  Technical
                </div>
                <div className="text-lg font-bold text-white">{report.categoryScores.technicalAccuracy}%</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{ width: `${report.categoryScores.technicalAccuracy}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  Communication
                </div>
                <div className="text-lg font-bold text-white">{report.categoryScores.communicationClarity}%</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{ width: `${report.categoryScores.communicationClarity}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  Problem Solving
                </div>
                <div className="text-lg font-bold text-white">{report.categoryScores.problemSolving}%</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{ width: `${report.categoryScores.problemSolving}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Users className="h-3.5 w-3.5 text-purple-400" />
                  Culture Fit
                </div>
                <div className="text-lg font-bold text-white">{report.categoryScores.culturalAlignment}%</div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{ width: `${report.categoryScores.culturalAlignment}%` }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Strengths and Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Key Demonstrated Strengths
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.keyStrengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">&bull;</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                <AlertTriangle className="h-4 w-4" />
                Targeted Growth Areas
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.growthAreas.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">&bull;</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Question by Question Detailed Breakdown */}
          {report.questionEvaluations && report.questionEvaluations.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Detailed Question Analysis
              </h3>
              <div className="space-y-4">
                {report.questionEvaluations.map((qe, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-400">Question #{idx + 1}</span>
                        <h4 className="text-sm font-semibold text-white mt-0.5">{qe.questionText}</h4>
                      </div>
                      <span className="shrink-0 rounded-lg bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 text-xs font-bold text-indigo-300">
                        {qe.score} / 100
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-900/80 p-3 text-xs text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Your Transcript:
                      </span>
                      <p className="italic">"{qe.candidateAnswer}"</p>
                    </div>

                    <div className="rounded-lg bg-indigo-950/20 border border-indigo-500/20 p-3 text-xs text-indigo-200">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
                        Tanya's Benchmark Ideal Answer:
                      </span>
                      <p>{qe.idealAnswer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4 print:hidden">
          <p className="text-xs text-slate-400">Progress recorded to your dashboard.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              Close
            </button>
            {onStartNew && (
              <button
                onClick={() => {
                  onClose();
                  onStartNew();
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
              >
                Start Another Interview
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
