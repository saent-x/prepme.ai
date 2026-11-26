import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import type { InferSelectModel } from 'drizzle-orm';
import type { Scorecard, TranscriptEntry } from '$lib/interview-types';
import type { Fit, Round } from '$lib/jobs';

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

/**
 * A job the user is preparing for: the advert, their CV, the date of the real
 * interview, how well they fit and the rounds to practise. Interviews link to
 * one, which is what turns separate practice calls into progress towards a job.
 */
export const jobTargets = sqliteTable(
  'job_targets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** The role, e.g. "Senior AI Engineer". */
    title: text('title').notNull(),
    company: text('company').notNull().default(''),
    location: text('location').notNull().default(''),
    /** The advert as pasted. Practice interviews for this job are tailored to it. */
    advert: text('advert').notNull(),
    cvText: text('cv_text'),
    cvName: text('cv_name'),
    /** Day of the real interview, as YYYY-MM-DD (a calendar day, so no time zone). */
    interviewDate: text('interview_date'),
    /** How the CV matches the advert. Null when no CV was given. */
    fit: text('fit', { mode: 'json' }).$type<Fit>(),
    /** The rounds to practise, in order. */
    rounds: text('rounds', { mode: 'json' }).$type<Round[]>().notNull(),
    createdAt: ts('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: ts('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
  },
  (t) => [index('job_targets_user_id_idx').on(t.userId)]
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
    /** The job this practice is for, if any. Deleting the job keeps the interview. */
    targetId: text('target_id').references(() => jobTargets.id, { onDelete: 'set null' }),
    /** Which of the job's rounds this practises (a Round id). */
    roundId: text('round_id'),

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
    index('interviews_agent_id_idx').on(t.agentId),
    index('interviews_target_id_idx').on(t.targetId)
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

/**
 * One "redo an answer" attempt: the candidate answered a scorecard question
 * again, and this is what they said and how it scored next to the first time.
 */
export const answerRedos = sqliteTable(
  'answer_redos',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    interviewId: text('interview_id')
      .notNull()
      .references(() => interviews.id, { onDelete: 'cascade' }),
    /** Position of the question in the interview's scorecard. */
    questionIndex: integer('question_index').notNull(),
    /** The question as asked, kept so the redo still reads right if the interview is scored again. */
    question: text('question').notNull(),
    /** What the candidate said this time. */
    answer: text('answer').notNull(),
    /** The scorecard's score for the first answer, out of 100. */
    previousScore: integer('previous_score').notNull(),
    /** This attempt's score, out of 100. */
    score: integer('score').notNull(),
    feedback: text('feedback').notNull(),
    tip: text('tip').notNull(),
    /** True when it was said out loud, false when typed. */
    spoken: integer('spoken', { mode: 'boolean' }).notNull().default(true),
    /** Seconds of speaking, 0 when typed. */
    seconds: integer('seconds').notNull().default(0),
    createdAt: ts('created_at')
      .notNull()
      .$defaultFn(() => new Date())
  },
  (t) => [
    index('answer_redos_interview_id_idx').on(t.interviewId),
    index('answer_redos_user_id_idx').on(t.userId)
  ]
);

export const USAGE_KINDS = ['voice', 'transcription', 'scoring', 'chat', 'fit', 'redo'] as const;

/**
 * What each interview cost in AI usage: one row per live voice session, per
 * session's transcription, per scoring run and per coach chat reply. Fit checks
 * for a job (no interview) and answer redos are recorded here too.
 *
 * `interviewId` is deliberately not a foreign key: the money was spent even if
 * the interview is deleted later, so the row has to outlive it.
 */
export const usageEvents = sqliteTable(
  'usage_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    /** Stable per thing measured (e.g. "<interview>:voice:2"), so repeated reports update one row. */
    key: text('key').notNull().unique(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    interviewId: text('interview_id'),
    kind: text('kind', { enum: USAGE_KINDS }).notNull(),
    model: text('model').notNull(),
    /** Voice and transcription: which live session of the interview (1 = first, 2+ = reconnects). */
    session: integer('session'),
    /** Voice: seconds the session was connected. Transcription: seconds of audio, when billed by length. */
    seconds: integer('seconds').notNull().default(0),
    /** Voice: the trimming limit in force (0 = trimming off), to compare trimmed calls with untrimmed ones. */
    contextLimit: integer('context_limit').notNull().default(0),
    /** Model replies counted in this row. */
    responses: integer('responses').notNull().default(0),
    /** Token counts. Input counts include the cached part; cached counts are the part re-read at the cheaper rate. */
    inputText: integer('input_text').notNull().default(0),
    inputAudio: integer('input_audio').notNull().default(0),
    cachedText: integer('cached_text').notNull().default(0),
    cachedAudio: integer('cached_audio').notNull().default(0),
    outputText: integer('output_text').notNull().default(0),
    outputAudio: integer('output_audio').notNull().default(0),
    /** Cost in millionths of a US dollar. Null when the model has no price in $lib/usage. */
    costMicros: integer('cost_micros'),
    createdAt: ts('created_at')
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: ts('updated_at')
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
  },
  (t) => [
    index('usage_events_interview_id_idx').on(t.interviewId),
    index('usage_events_created_at_idx').on(t.createdAt)
  ]
);

export type Agent = InferSelectModel<typeof agents>;
export type JobTarget = InferSelectModel<typeof jobTargets>;
export type Interview = InferSelectModel<typeof interviews>;
export type InterviewMessage = InferSelectModel<typeof interviewMessages>;
export type AnswerRedo = InferSelectModel<typeof answerRedos>;
export type UsageEvent = InferSelectModel<typeof usageEvents>;
export type UsageKind = (typeof USAGE_KINDS)[number];
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
