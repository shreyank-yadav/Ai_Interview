/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Trash2,
  ArrowRight,
  RefreshCw,
  FileCode,
} from 'lucide-react';
import { ParsedResume } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ResumeStudioPageProps {
  onStartTailoredInterview: (resumeId: string) => void;
}

const SAMPLE_RESUME_TEXT = `Alex Mercer
Senior Software Engineer | alex.mercer@gmail.com | Seattle, WA
github.com/alexmercer | linkedin.com/in/alexmercer

PROFESSIONAL SUMMARY
Senior Full-Stack & Distributed Systems Engineer with 6+ years building high-throughput microservices in Go, TypeScript, React, and AWS. Proven success architecting event-driven architectures handling 120,000 requests/sec with p99 latency < 25ms.

CORE COMPETENCIES
Languages & Frameworks: TypeScript, JavaScript, Go, Python, React, Next.js, Node.js, Express, Tailwind CSS
Databases & Distributed Systems: PostgreSQL, Redis, Apache Kafka, DynamoDB, Elasticsearch
DevOps & Cloud: Docker, Kubernetes, AWS (Lambda, ECS, SQS, S3, CloudFront), Terraform, CI/CD (GitHub Actions)
Architecture: Microservices, Event-Driven Architecture, REST APIs, GraphQL, Idempotency & Fault Tolerance

WORK EXPERIENCE
Senior Software Engineer | CloudScale Systems (2022 - Present)
- Architected distributed notification and messaging engine processing 120k events/sec using Kafka, Redis cluster, and Go microservices, reducing delivery lag by 52%.
- Refactored core payment gateway integration with idempotent transaction ledgers and automated webhook retry reconciliation.
- Mentored 4 engineers and instituted rigorous pull request automated linting and integration testing, cutting deployment rollbacks by 35%.

Full-Stack Engineer | Apex Digital Solutions (2020 - 2022)
- Built interactive analytics dashboards in React and TypeScript for 80,000+ daily active enterprise users.
- Designed high-throughput GraphQL federation gateway reducing mobile app bundle size by 28%.
- Optimized database indexing and slow query plans on PostgreSQL, shaving 180ms off checkout endpoint latency.

EDUCATION
B.S. in Computer Science | University of Washington (2016 - 2020)`;

export const ResumeStudioPage: React.FC<ResumeStudioPageProps> = ({ onStartTailoredInterview }) => {
  const [resumes, setResumes] = useState<ParsedResume[]>([]);
  const [selectedResume, setSelectedResume] = useState<ParsedResume | null>(null);
  const [resumeText, setResumeText] = useState(SAMPLE_RESUME_TEXT);
  const [fileName, setFileName] = useState('Alex_Mercer_Senior_FullStack.pdf');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await api.getResumes();
      setResumes(res.resumes || []);
      if (res.resumes?.length > 0 && !selectedResume) {
        setSelectedResume(res.resumes[0]);
      }
    } catch (err: any) {
      console.warn('[ResumeStudio] Fetch resumes error:', err);
    }
  };

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [base64Content, setBase64Content] = useState<string | null>(null);

  const handleUploadAndParse = async () => {
    if (!resumeText.trim()) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      // Issue 7 & 8: Explicitly differentiate physical file upload from pasted text
      const res = await api.uploadResume({
        fileName: uploadedFile ? uploadedFile.name : (fileName || 'pasted_resume.txt'),
        textContent: resumeText,
        base64Content: base64Content || undefined,
      });
      setResumes(prev => [res.resume, ...prev]);
      setSelectedResume(res.resume);
      // Reset file picker after upload
      setUploadedFile(null);
      setBase64Content(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse resume with AI');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await api.deleteResume(id);
      const remaining = resumes.filter(r => r.id !== id);
      setResumes(remaining);
      if (selectedResume?.id === id) {
        setSelectedResume(remaining[0] || null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete resume');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setFileName(file.name);

    // Read base64 for server storage in STORAGE_DIR
    const b64Reader = new FileReader();
    b64Reader.onload = evt => {
      setBase64Content(evt.target?.result as string);
    };
    b64Reader.readAsDataURL(file);

    // Read text for preview and NLP analysis
    const textReader = new FileReader();
    textReader.onload = event => {
      const content = event.target?.result as string;
      setResumeText(content || '');
    };
    textReader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-lg bg-purple-500/20 border border-purple-500/30 p-1.5 text-purple-400">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              AI Resume Studio & ATS Analyzer
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Upload your PDF or DOCX resume to extract technical competencies, calculate ATS compatibility, and let Tanya generate customized interview questions.
          </p>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {/* Two Column Layout: Upload / Parser on Left, ATS Insights on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload / Paste (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-400" />
              Upload or Paste Resume Content
            </h2>

            {/* File dropzone picker */}
            <div className="relative rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-center hover:border-indigo-500 transition cursor-pointer">
              <input
                type="file"
                accept=".txt,.pdf,.docx,.md"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileCode className="mx-auto h-7 w-7 text-indigo-400 mb-1" />
              <p className="text-xs font-semibold text-slate-200">
                {fileName ? fileName : 'Choose PDF, DOCX or TXT file'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click to browse or paste raw text below</p>
            </div>

            {/* Resume Text Area */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                Resume Plain Text
              </label>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={10}
                placeholder="Paste your resume contents here..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleUploadAndParse}
              disabled={isUploading || !resumeText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 transition disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Gemini Parsing Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze with Tanya
                </>
              )}
            </button>
          </div>

          {/* Saved Resumes List */}
          {resumes.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Saved Resumes ({resumes.length})
              </h3>
              <div className="space-y-1.5">
                {resumes.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResume(r)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      selectedResume?.id === r.id
                        ? 'border-indigo-500 bg-indigo-950/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate">{r.fileName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span>ATS Score: {r.atsScore}%</span>
                          <span>&bull;</span>
                          <span className={r.sourceType === 'file_upload' ? 'text-indigo-400 font-medium' : 'text-amber-400 font-medium'}>
                            {r.sourceType === 'file_upload' ? 'Physical File' : 'Pasted Text'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteResume(r.id);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                      title="Delete resume"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ATS Report & Interview Tailor (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedResume ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 shadow-2xl">
              {/* ATS Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-slate-800 bg-gradient-to-r from-slate-950 to-indigo-950/30 p-5 gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-2xl font-extrabold text-indigo-400 shadow-inner">
                    {selectedResume.atsScore}
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      ATS Match Score
                    </span>
                    <h3 className="text-base font-bold text-white">{selectedResume.candidateName}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">
                        {selectedResume.experienceYears}+ years estimated experience
                      </span>
                      <span className="text-slate-600">&bull;</span>
                      {selectedResume.sourceType === 'file_upload' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                          <FileText className="h-3 w-3" />
                          Stored: {selectedResume.storedFilePath || selectedResume.fileName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Pasted Text Analysis (No file uploaded)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct CTA: Launch Tailored Interview */}
                <button
                  onClick={() => onStartTailoredInterview(selectedResume.id)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  Interview on This Resume
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Summary</h4>
                <p className="text-xs text-slate-200 leading-relaxed rounded-xl border border-slate-800 bg-slate-950 p-3">
                  {selectedResume.summary}
                </p>
              </div>

              {/* Extracted Skills Cloud */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Extracted Technical Skills ({selectedResume.extractedSkills?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedResume.extractedSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-2.5 py-1 text-xs font-semibold text-indigo-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Highlights & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
                  <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-400 mb-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Key Experience Highlights
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedResume.experienceHighlights?.map((hl, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">&bull;</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
                  <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase text-amber-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    ATS Optimization Gaps
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedResume.potentialGaps?.map((gap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">&bull;</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tanya Tailored Questions */}
              <div className="space-y-2 rounded-xl border border-purple-500/20 bg-purple-950/10 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Tanya's Tailored Interview Questions for this Candidate:
                </h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  {selectedResume.tailoredQuestions?.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-purple-400">{idx + 1}.</span>
                      <span>"{q}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              <FileText className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs">No resume selected. Paste or upload your resume on the left to start.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
