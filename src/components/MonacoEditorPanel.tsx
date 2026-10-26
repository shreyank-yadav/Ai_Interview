/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, CheckCircle2, XCircle, Clock, Sparkles, Terminal, Code2 } from 'lucide-react';
import { CodingProblem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface MonacoEditorPanelProps {
  problem?: CodingProblem;
  onSubmitCode?: (code: string, language: string) => void;
}

export const MonacoEditorPanel: React.FC<MonacoEditorPanelProps> = ({
  problem,
  onSubmitCode,
}) => {
  const [language, setLanguage] = useState<'javascript' | 'python' | 'typescript' | 'cpp' | 'java'>('javascript');
  const [code, setCode] = useState(
    problem?.starterCode?.[language] ||
      `// Write your solution here\nfunction solution() {\n  return "Ready";\n}\nconsole.log(solution());`
  );
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'cases' | 'console' | 'ai'>('cases');

  // Switch starter code when language changes
  const handleLanguageChange = (newLang: any) => {
    setLanguage(newLang);
    if (problem?.starterCode?.[newLang as keyof typeof problem.starterCode]) {
      setCode(problem.starterCode[newLang as keyof typeof problem.starterCode]);
    }
  };

  const handleResetCode = () => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language]);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    try {
      const res = await api.executeCode({
        language,
        code,
        problemId: problem?.id,
        testCases: problem?.testCases,
      });
      setExecutionResult(res);
      if (res.aiReview) {
        setActiveTab('cases');
      }
    } catch (err: any) {
      setExecutionResult({
        success: false,
        stderr: err.message || 'Execution error in sandbox',
        results: [],
        allPassed: false,
      });
      setActiveTab('console');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Editor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Code2 className="h-4 w-4 text-indigo-400" />
            <span>Monaco Coding Sandbox</span>
          </div>

          {/* Language selector */}
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="javascript">JavaScript (ES6)</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (GCC)</option>
            <option value="java">Java 17</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCode}
            title="Reset code to starter template"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Tests...' : 'Run Code'}
          </button>

          {onSubmitCode && (
            <button
              onClick={() => onSubmitCode(code, language)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition cursor-pointer"
            >
              Submit to Tanya
            </button>
          )}
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 min-h-[320px]">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : 'javascript'}
          theme="vs-dark"
          value={code}
          onChange={val => setCode(val || '')}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Bottom Execution Results Panel */}
      <div className="border-t border-slate-800 bg-slate-900/90 flex flex-col">
        {/* Result tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeTab === 'cases'
                  ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Test Cases ({executionResult?.passedTests || 0}/{executionResult?.totalTests || problem?.testCases.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                activeTab === 'console'
                  ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              Stdout / Logs
            </button>
            {executionResult?.aiReview && (
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  activeTab === 'ai'
                    ? 'bg-purple-600/20 text-purple-300 ring-1 ring-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Tanya's Code Review
              </button>
            )}
          </div>

          {executionResult && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="h-3 w-3" />
                {executionResult.executionTimeMs} ms
              </span>
              <span
                className={`font-semibold rounded-md px-2 py-0.5 ${
                  executionResult.allPassed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {executionResult.allPassed ? 'ALL TESTS PASSED' : 'TESTS FAILED'}
              </span>
            </div>
          )}
        </div>

        {/* Tab content area */}
        <div className="max-h-48 overflow-y-auto p-4 text-xs font-mono">
          {activeTab === 'cases' && (
            <div className="space-y-2">
              {executionResult?.results && executionResult.results.length > 0 ? (
                executionResult.results.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-2.5 ${
                      r.passed
                        ? 'border-emerald-500/30 bg-emerald-950/20'
                        : 'border-red-500/30 bg-red-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-200">Test Case #{r.testIndex}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          r.passed ? 'text-emerald-400 bg-emerald-500/20' : 'text-red-400 bg-red-500/20'
                        }`}
                      >
                        {r.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {r.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Input:</span>
                        <code className="text-slate-200">{r.input}</code>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Expected:</span>
                        <code className="text-emerald-300">{r.expectedOutput}</code>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block">Actual:</span>
                        <code className={r.passed ? 'text-emerald-300' : 'text-red-300'}>
                          {r.actualOutput}
                        </code>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-3 text-center">
                  Click <strong className="text-emerald-400">Run Code</strong> to execute your solution against test cases.
                </div>
              )}
            </div>
          )}

          {activeTab === 'console' && (
            <div>
              {executionResult?.stderr && (
                <pre className="text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-500/30 whitespace-pre-wrap mb-2">
                  {executionResult.stderr}
                </pre>
              )}
              {executionResult?.stdout ? (
                <pre className="text-slate-300 whitespace-pre-wrap">{executionResult.stdout}</pre>
              ) : (
                <p className="text-slate-500">No standard output logged. Use console.log() or print() to inspect variables.</p>
              )}
            </div>
          )}

          {activeTab === 'ai' && executionResult?.aiReview && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center gap-4 bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-purple-300 uppercase font-semibold">Time Complexity</span>
                  <p className="text-sm font-bold text-white font-mono">{executionResult.aiReview.timeComplexity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 uppercase font-semibold">Space Complexity</span>
                  <p className="text-sm font-bold text-white font-mono">{executionResult.aiReview.spaceComplexity}</p>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 uppercase font-semibold">Quality Score</span>
                  <p className="text-sm font-bold text-emerald-400">{executionResult.aiReview.qualityScore} / 100</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Tanya's Verbal Assessment:
                </p>
                <p className="text-xs text-slate-200 italic">"{executionResult.aiReview.tanyaFeedback}"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
