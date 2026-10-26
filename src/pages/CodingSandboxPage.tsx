/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Code2, Sparkles, CheckCircle2, ChevronRight, FileCode, Play } from 'lucide-react';
import { CodingProblem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { MonacoEditorPanel } from '../components/MonacoEditorPanel.tsx';

interface CodingSandboxPageProps {
  onStartDSAInterview?: (problemId: string) => void;
}

export const CodingSandboxPage: React.FC<CodingSandboxPageProps> = ({ onStartDSAInterview }) => {
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.getProblems();
        setProblems(res.problems || []);
        if (res.problems?.length > 0) {
          setSelectedProblem(res.problems[0]);
        }
      } catch (err) {
        console.warn('[CodingSandbox] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-1.5 text-emerald-400">
              <Code2 className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Monaco Algorithmic Coding Arena
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Practice real technical interview problems in Python, JavaScript, TypeScript, C++, and Java with isolated test executions and Gemini AI Big-O complexity feedback.
          </p>
        </div>

        {selectedProblem && onStartDSAInterview && (
          <button
            onClick={() => onStartDSAInterview(selectedProblem.id)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Mock Interview with Tanya on this Problem
          </button>
        )}
      </div>

      {/* Main Grid: Problem Prompt on Left (4 Cols), Monaco Editor on Right (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Picker & Description (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Problem Selector List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Algorithmic Challenge
            </h2>
            <div className="space-y-1.5">
              {problems.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProblem(p)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition ${
                    selectedProblem?.id === p.id
                      ? 'border-emerald-500 bg-emerald-950/20 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">{p.title}</p>
                    <p className="text-[10px] text-slate-400">{p.category}</p>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      p.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : p.difficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Problem Description & Constraints */}
          {selectedProblem && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-2">{selectedProblem.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedProblem.description}</p>
              </div>

              {/* Examples */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Examples:</span>
                {selectedProblem.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-[11px] font-mono space-y-1">
                    <p className="text-slate-300">
                      <strong className="text-slate-500 font-sans">Input: </strong>
                      {ex.input}
                    </p>
                    <p className="text-emerald-300">
                      <strong className="text-slate-500 font-sans">Output: </strong>
                      {ex.output}
                    </p>
                    {ex.explanation && (
                      <p className="text-slate-400 font-sans text-[10px] pt-1 border-t border-slate-900">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Constraints:</span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {selectedProblem.constraints.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 font-mono text-[11px]">
                      <span className="text-emerald-400">&bull;</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Monaco Code Editor & Test Cases (8 Cols) */}
        <div className="lg:col-span-8 h-[650px]">
          {selectedProblem ? (
            <MonacoEditorPanel
              problem={selectedProblem}
              onSubmitCode={(code, lang) => {
                alert(`Code in ${lang} validated! Ready to present to Tanya in an interview session.`);
              }}
            />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
              Loading coding problem...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
