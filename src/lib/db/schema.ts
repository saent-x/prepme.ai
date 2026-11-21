import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  jsonb,
  index
} from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';
import type { InferSelectModel } from 'drizzle-orm';
import type { Scorecard, TranscriptEntry } from '$lib/interview-types';

// ---------------------------------------------------------------------------
// Better Auth tables (names and columns must match what Better Auth expects)
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull()
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  },
  (t) => [index('session_user_id_idx').on(t.userId)]
);

export const account = pgTable(
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
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
  },
  (t) => [index('account_user_id_idx').on(t.userId)]
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at').$defaultFn(() => new Date())
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
export const agents = pgTable(
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date())
  },
  (t) => [index('agents_user_id_idx').on(t.userId)]
);

export const interviewStatus = pgEnum('interview_status', [
  'upcoming',
  'active',
  'completed',
  'processing',
  'cancelled'
]);

export const interviews = pgTable(
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

    status: interviewStatus('status').notNull().default('upcoming'),

    /** Optional job description the interviewer tailors questions to. */
    jobDescription: text('job_description'),
    /** Free-text focus areas, e.g. "system design, leadership". */
    focus: text('focus'),
    /** Target length; the interviewer wraps up near the end. */
    durationMinutes: integer('duration_minutes').notNull().default(20),

    /** Live transcript, saved by the browser while the call runs. */
    transcript: jsonb('transcript').$type<TranscriptEntry[]>(),
    /** Structured feedback produced after the call. */
    scorecard: jsonb('scorecard').$type<Scorecard>(),
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

    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at')
  },
  (t) => [
    index('interviews_user_id_idx').on(t.userId),
    index('interviews_agent_id_idx').on(t.agentId)
  ]
);

/** Follow-up "Ask about this interview" chat. Replaces Stream Chat. */
export const interviewMessages = pgTable(
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
    createdAt: timestamp('created_at').notNull().defaultNow()
  },
  (t) => [index('interview_messages_interview_id_idx').on(t.interviewId)]
);

export type Agent = InferSelectModel<typeof agents>;
export type Interview = InferSelectModel<typeof interviews>;
export type InterviewMessage = InferSelectModel<typeof interviewMessages>;
export type InterviewStatus = (typeof interviewStatus.enumValues)[number];
