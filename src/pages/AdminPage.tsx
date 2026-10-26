/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  ShieldAlert,
  Users,
  Settings,
  TrendingUp,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { User, TanyaPersonaConfig, SystemAuditLog } from '../types/index.ts';
import { api } from '../services/api.ts';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [persona, setPersona] = useState<TanyaPersonaConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'tanya' | 'logs'>('stats');
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [sRes, uRes, pRes, lRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getTanyaPersona(),
        api.getAuditLogs(),
      ]);
      setStats(sRes);
      setUserList(uRes.users || []);
      setPersona(pRes.persona);
      setAuditLogs(lRes.logs || []);
    } catch (err) {
      console.warn('[Admin] Error fetching admin data:', err);
    }
  };

  const handleUpdateUserTier = async (userId: string, tier: string, credits: number) => {
    try {
      const res = await api.updateUserTier(userId, tier, credits);
      setUserList(prev => prev.map(u => (u.id === userId ? res.user : u)));
      setStatusMessage(`User subscription updated to ${tier}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update user tier');
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'candidate' : 'admin';
    try {
      const res = await api.updateUserRole(userId, newRole);
      setUserList(prev => prev.map(u => (u.id === userId ? res.user : u)));
      setStatusMessage(`User role updated to ${newRole}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user role');
    }
  };

  const handleSavePersona = async () => {
    if (!persona) return;
    setIsSavingPersona(true);
    try {
      const res = await api.updateTanyaPersona(persona);
      setPersona(res.persona);
      setStatusMessage('Tanya persona parameters saved successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save Tanya configuration');
    } finally {
      setIsSavingPersona(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-lg bg-purple-500/20 border border-purple-500/30 p-1.5 text-purple-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              PrepNova Admin Governance & Tanya Tuner Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Monitor PrepNova platform metrics, control candidate subscriptions, audit security actions, and customize Tanya's interviewer persona.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Users ({userList.length})
          </button>
          <button
            onClick={() => setActiveTab('tanya')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'tanya'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tanya Tuner
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <p className="text-2xl font-extrabold text-white mt-1">{stats.totalUsers}</p>
              <p className="text-[11px] text-slate-500 mt-1">{stats.premiumUsers} on Premium Tier</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mock Interviews</span>
              <p className="text-2xl font-extrabold text-white mt-1">{stats.totalInterviews}</p>
              <p className="text-[11px] text-slate-500 mt-1">{stats.completedInterviews} completed with reports</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Candidate Score</span>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{stats.averageScore} / 100</p>
              <p className="text-[11px] text-slate-500 mt-1">Pass Rate: {stats.passRatePercentage}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">₹{stats.totalRevenueINR.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-1">Verified via Razorpay Test Mode</p>
            </div>
          </div>

          {/* Track Popularity */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Interview Assessment Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(stats.trackBreakdown || {}).map(([track, count]: any) => (
                <div key={track} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <span className="text-xs uppercase font-bold text-indigo-400 block mb-1">{track}</span>
                  <span className="text-2xl font-extrabold text-white">{count}</span>
                  <span className="text-xs text-slate-500 ml-1">sessions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Candidate & Administrator Directory</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="pb-3 pl-2">User</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Subscription</th>
                  <th className="pb-3">Remaining Credits</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {userList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 pl-2 font-medium">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5">
                      <button
                        onClick={() => handleToggleUserRole(u.id, u.role)}
                        className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {u.role} (Click to toggle)
                      </button>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          u.subscriptionTier === 'premium'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.subscriptionTier}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-indigo-400">
                      {u.subscriptionTier === 'premium' ? '∞ Unlimited' : u.interviewCreditsRemaining}
                    </td>
                    <td className="py-3.5 pr-2 text-right space-x-2">
                      <button
                        onClick={() =>
                          handleUpdateUserTier(
                            u.id,
                            u.subscriptionTier === 'premium' ? 'free' : 'premium',
                            u.subscriptionTier === 'premium' ? 3 : 999
                          )
                        }
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      >
                        {u.subscriptionTier === 'premium' ? 'Downgrade to Free' : 'Grant Premium'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tanya Persona Tuner Tab */}
      {activeTab === 'tanya' && persona && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Tanya Persona & Behavior Tuning
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure interviewer tone, strictness, avatar image, and welcome prompt.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Interviewer Name</label>
              <input
                type="text"
                value={persona.name}
                onChange={e => setPersona({ ...persona, name: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={persona.customAvatarUrl || ''}
                onChange={e => setPersona({ ...persona, customAvatarUrl: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Interviewer Persona Tone</label>
                <select
                  value={persona.tone}
                  onChange={e => setPersona({ ...persona, tone: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="supportive">Supportive & Empathetic Mentor</option>
                  <option value="neutral">Objective Corporate Assessor</option>
                  <option value="faang_strict">Strict FAANG Bar Raiser</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Gemini TTS Voice Name</label>
                <select
                  value={persona.voiceName || 'Kore'}
                  onChange={e => setPersona({ ...persona, voiceName: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Kore">Kore (Clear, articulate female voice)</option>
                  <option value="Puck">Puck (Energetic and bright)</option>
                  <option value="Fenrir">Fenrir (Authoritative and deep)</option>
                  <option value="Zephyr">Zephyr (Calm and composed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Initial Welcome Statement (Spoken by Tanya at interview start)
              </label>
              <textarea
                value={persona.welcomeMessage}
                onChange={e => setPersona({ ...persona, welcomeMessage: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePersona}
                disabled={isSavingPersona}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                {isSavingPersona ? 'Saving Settings...' : 'Save Tanya Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Security & System Audit Trail ({auditLogs.length} Events)
          </h3>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 text-xs gap-2"
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                    <span className="text-slate-500">&bull;</span>
                    <span className="text-slate-400 font-mono text-[11px]">{log.actorEmail}</span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
