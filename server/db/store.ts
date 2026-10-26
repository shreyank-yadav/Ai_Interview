/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import {
  User,
  InterviewSession,
  InterviewReport,
  ParsedResume,
  CodingProblem,
  TanyaPersonaConfig,
  PaymentOrder,
  SystemAuditLog
} from './schema.ts';
import {
  SEED_USERS,
  DEFAULT_TANYA_PERSONA,
  SEED_CODING_PROBLEMS,
  SEED_RESUMES,
  SEED_COMPLETED_SESSION
} from './seed.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'tanya_database.json');

interface DatabaseShape {
  users: User[];
  sessions: InterviewSession[];
  reports: InterviewReport[];
  resumes: ParsedResume[];
  problems: CodingProblem[];
  persona: TanyaPersonaConfig;
  payments: PaymentOrder[];
  auditLogs: SystemAuditLog[];
}

class TanyaDatabaseStore {
  private data: DatabaseShape;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): DatabaseShape {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users?.length ? parsed.users : [...SEED_USERS],
          sessions: parsed.sessions?.length ? parsed.sessions : [SEED_COMPLETED_SESSION],
          reports: parsed.reports?.length ? parsed.reports : (SEED_COMPLETED_SESSION.report ? [SEED_COMPLETED_SESSION.report] : []),
          resumes: parsed.resumes?.length ? parsed.resumes : [...SEED_RESUMES],
          problems: parsed.problems?.length ? parsed.problems : [...SEED_CODING_PROBLEMS],
          persona: parsed.persona ? parsed.persona : { ...DEFAULT_TANYA_PERSONA },
          payments: parsed.payments || [],
          auditLogs: parsed.auditLogs || [],
        };
      }
    } catch (err) {
      console.warn('[DB] Could not load persisted data file, initializing from seeds:', err);
    }

    return {
      users: [...SEED_USERS],
      sessions: [SEED_COMPLETED_SESSION],
      reports: SEED_COMPLETED_SESSION.report ? [SEED_COMPLETED_SESSION.report] : [],
      resumes: [...SEED_RESUMES],
      problems: [...SEED_CODING_PROBLEMS],
      persona: { ...DEFAULT_TANYA_PERSONA },
      payments: [],
      auditLogs: [
        {
          id: 'log_seed_1',
          timestamp: new Date().toISOString(),
          action: 'SYSTEM_INIT',
          actorEmail: 'system@tanya-ai.com',
          details: 'Tanya AI Interviewer database initialized with seed records.',
        }
      ],
    };
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist data to disk:', err);
    }
  }

  // --- Users ---
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.logAction('USER_REGISTERED', user.email, `User created with tier ${user.subscriptionTier}`);
    this.persist();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...rest }) => rest as User);
  }

  // --- Interview Sessions ---
  createSession(session: InterviewSession): InterviewSession {
    this.data.sessions.unshift(session);
    this.logAction('INTERVIEW_STARTED', session.userId, `Type: ${session.type}, Difficulty: ${session.difficulty}`);
    this.persist();
    return session;
  }

  getSessionById(id: string): InterviewSession | undefined {
    return this.data.sessions.find(s => s.id === id);
  }

  getUserSessions(userId: string): InterviewSession[] {
    return this.data.sessions.filter(s => s.userId === userId);
  }

  getAllSessions(): InterviewSession[] {
    return this.data.sessions;
  }

  updateSession(id: string, updates: Partial<InterviewSession>): InterviewSession | undefined {
    const idx = this.data.sessions.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.sessions[idx] = { ...this.data.sessions[idx], ...updates };
    this.persist();
    return this.data.sessions[idx];
  }

  // --- Reports ---
  saveReport(report: InterviewReport): InterviewReport {
    const existingIdx = this.data.reports.findIndex(r => r.sessionId === report.sessionId);
    if (existingIdx !== -1) {
      this.data.reports[existingIdx] = report;
    } else {
      this.data.reports.unshift(report);
    }
    // Also attach to session
    const session = this.getSessionById(report.sessionId);
    if (session) {
      session.report = report;
      session.status = 'completed';
      session.completedAt = report.generatedAt;
    }
    this.logAction('REPORT_GENERATED', report.sessionId, `Score: ${report.overallScore}, Recommendation: ${report.recommendation}`);
    this.persist();
    return report;
  }

  getReportBySessionId(sessionId: string): InterviewReport | undefined {
    return this.data.reports.find(r => r.sessionId === sessionId);
  }

  // --- Resumes ---
  saveResume(resume: ParsedResume): ParsedResume {
    this.data.resumes.unshift(resume);
    this.logAction('RESUME_UPLOADED', resume.userId, `File: ${resume.fileName}, ATS Score: ${resume.atsScore}`);
    this.persist();
    return resume;
  }

  getUserResumes(userId: string): ParsedResume[] {
    return this.data.resumes.filter(r => r.userId === userId);
  }

  getResumeById(id: string): ParsedResume | undefined {
    return this.data.resumes.find(r => r.id === id);
  }

  deleteResume(id: string, userId: string): boolean {
    const initLen = this.data.resumes.length;
    this.data.resumes = this.data.resumes.filter(r => !(r.id === id && r.userId === userId));
    const deleted = this.data.resumes.length < initLen;
    if (deleted) this.persist();
    return deleted;
  }

  // --- Coding Problems ---
  getProblems(): CodingProblem[] {
    return this.data.problems;
  }

  getProblemById(id: string): CodingProblem | undefined {
    return this.data.problems.find(p => p.id === id);
  }

  // --- Tanya Persona Config ---
  getTanyaPersona(): TanyaPersonaConfig {
    return this.data.persona;
  }

  updateTanyaPersona(updates: Partial<TanyaPersonaConfig>): TanyaPersonaConfig {
    this.data.persona = { ...this.data.persona, ...updates };
    this.logAction('TANYA_CONFIG_UPDATED', 'admin', `Updated persona attributes: ${Object.keys(updates).join(', ')}`);
    this.persist();
    return this.data.persona;
  }

  // --- Payments & Orders ---
  createPaymentOrder(order: PaymentOrder): PaymentOrder {
    this.data.payments.unshift(order);
    this.logAction('PAYMENT_ORDER_CREATED', order.userId, `Order ${order.orderId} for ${order.amount / 100} INR`);
    this.persist();
    return order;
  }

  getPaymentOrderByOrderId(orderId: string): PaymentOrder | undefined {
    return this.data.payments.find(p => p.orderId === orderId);
  }

  updatePaymentOrder(orderId: string, updates: Partial<PaymentOrder>): PaymentOrder | undefined {
    const idx = this.data.payments.findIndex(p => p.orderId === orderId);
    if (idx === -1) return undefined;
    this.data.payments[idx] = { ...this.data.payments[idx], ...updates };
    this.persist();
    return this.data.payments[idx];
  }

  getAllPayments(): PaymentOrder[] {
    return this.data.payments;
  }

  // --- Audit Logs ---
  logAction(action: string, actorEmail: string, details: string) {
    const log: SystemAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      actorEmail,
      details,
    };
    this.data.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.length = 1000;
    }
    this.persist();
  }

  getAuditLogs(): SystemAuditLog[] {
    return this.data.auditLogs;
  }
}

export const dbStore = new TanyaDatabaseStore();
