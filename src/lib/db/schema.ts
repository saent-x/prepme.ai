import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import type { InferSelectModel } from 'drizzle-orm';
import type { Scorecard, TranscriptEntry } from '$lib/interview-types';

/** Timestamps are stored as integer milliseconds since the epoch (D1 / SQLite). */
const ts = (name: string) => integer(name, { mode: 'timestamp_ms' });

// ---------------------------------------------------------------------------
// Better Auth tables (names and columns must match what Better Auth expects)
// ---------------------------------------------------------------------------

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: ts('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: ts('updated_at')
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull()
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: ts('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  },
  (t) => [index('session_user_id_idx').on(t.userId)]
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: ts('access_token_expires_at'),
    refreshTokenExpiresAt: ts('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull()
  },
  (t) => [index('account_user_id_idx').on(t.userId)]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: ts('expires_at').notNull(),
    createdAt: ts('created_at').$defaultFn(() => new Date()),
    updatedAt: ts('updated_at').$defaultFn(() => new Date())
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)]
);

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

/**
 * Interviewers. The table keeps its original name ("agents") so existing rows
 * survive the upgrade; the UI calls them interviewers.
 */
export const agents = sqliteTable(
  'agents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    instructions: text('instructions').notNull(),
    /** Template this interviewer was created from (see $lib/templates). */
    template: text('template'),
    /** OpenAI realtime voice. */
    voice: text('voice').notNull().default('marin'),
    createdAt: ts('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: ts('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
  },
  (t) => [index('agents_user_id_idx').on(t.userId)]
);

export const INTERVIEW_STATUSES = [
  'upcoming',
  'active',
  'completed',
  'processing',
  'cancelled'
] as const;

export const interviews = sqliteTable(
  'interviews',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text('name').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),

    status: text('status', { enum: INTERVIEW_STATUSES }).notNull().default('upcoming'),

    /** Optional job description the interviewer tailors questions to. */
    jobDescription: text('job_description'),
    /** Text read from the candidate's CV, so the interviewer can ask about their real experience. */
    cvText: text('cv_text'),
    /** The CV's file name, shown as a chip. */
    cvName: text('cv_name'),
    /** Free-text focus areas, e.g. "system design, leadership". */
    focus: text('focus'),
    /** Target length; the interviewer wraps up near the end. */
    durationMinutes: integer('duration_minutes').notNull().default(20),

    /** Live transcript, saved by the browser while the call runs. */
    transcript: text('transcript', { mode: 'json' }).$type<TranscriptEntry[]>(),
    /** Structured feedback produced after the call. */
    scorecard: text('scorecard', { mode: 'json' }).$type<Scorecard>(),
    overallScore: integer('overall_score'),
    /** Short markdown overview (kept for interviews made before v2 too). */
    summary: text('summary'),
    /** Last analysis error, shown with a retry button. */
    analysisError: text('analysis_error'),
    /** How many times a realtime session was started (resumes after a drop count too). */
    sessionCount: integer('session_count').notNull().default(0),
    realtimeModel: text('realtime_model'),

    /** Legacy (Stream) fields, kept so old interviews still render. */
    transcriptUrl: text('transcript_url'),
    recordingUrl: text('recording_url'),

    createdAt: ts('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: ts('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    startedAt: ts('started_at'),
    endedAt: ts('ended_at')
  },
  (t) => [
    index('interviews_user_id_idx').on(t.userId),
    index('interviews_agent_id_idx').on(t.agentId)
  ]
);

/** Follow-up "Ask about this interview" chat. Replaces Stream Chat. */
export const interviewMessages = sqliteTable(
  'interview_messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    interviewId: text('interview_id')
      .notNull()
      .references(() => interviews.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    createdAt: ts('created_at')
      .notNull()
      .$defaultFn(() => new Date())
  },
  (t) => [index('interview_messages_interview_id_idx').on(t.interviewId)]
);

export type Agent = InferSelectModel<typeof agents>;
export type Interview = InferSelectModel<typeof interviews>;
export type InterviewMessage = InferSelectModel<typeof interviewMessages>;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
