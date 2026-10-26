/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { InterviewRoomPage } from './pages/InterviewRoomPage.tsx';
import { ResumeStudioPage } from './pages/ResumeStudioPage.tsx';
import { CodingSandboxPage } from './pages/CodingSandboxPage.tsx';
import { PricingPage } from './pages/PricingPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { AuthModal } from './pages/AuthModal.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Selected parameters when launching an interview
  const [interviewConfig, setInterviewConfig] = useState({
    type: 'technical',
    roleTarget: 'Senior Full-Stack Engineer',
    difficulty: 'senior',
  });

  const handleStartInterview = (
    type: string = 'technical',
    roleTarget: string = 'Senior Software Engineer',
    difficulty: string = 'mid'
  ) => {
    setInterviewConfig({ type, roleTarget, difficulty });
    setCurrentTab('interview');
  };

  const handleStartResumeInterview = (resumeId: string) => {
    setInterviewConfig({
      type: 'resume',
      roleTarget: 'Senior Full-Stack Engineer',
      difficulty: 'senior',
    });
    setCurrentTab('interview');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Initializing Tanya AI Interview Platform...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardPage
            onStartInterview={handleStartInterview}
            onNavigateTab={tab => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'interview' && (
          <InterviewRoomPage
            initialType={interviewConfig.type}
            initialRole={interviewConfig.roleTarget}
            initialDifficulty={interviewConfig.difficulty}
            onExit={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'resume' && (
          <ResumeStudioPage onStartTailoredInterview={handleStartResumeInterview} />
        )}

        {currentTab === 'coding' && (
          <CodingSandboxPage
            onStartDSAInterview={problemId => {
              setInterviewConfig({
                type: 'dsa',
                roleTarget: 'Algorithms & Problem Solving',
                difficulty: 'senior',
              });
              setCurrentTab('interview');
            }}
          />
        )}

        {currentTab === 'pricing' && <PricingPage />}

        {currentTab === 'admin' && <AdminPage />}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; {new Date().getFullYear()} Tanya AI Interviewer SaaS. Production-ready interview engineering.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Server-side Gemini 3.8 Flash & TTS</span>
            <span>&bull;</span>
            <span>Razorpay Test Mode Verified</span>
            <span>&bull;</span>
            <span>Monaco Sandbox</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
