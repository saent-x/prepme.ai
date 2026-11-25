/** Starter interviewers. Shared by the server (seeding) and the UI (template picker). */
export type InterviewerTemplate = {
  id: string;
  name: string;
  tagline: string;
  category: 'Engineering' | 'AI' | 'Behavioural' | 'Product' | 'General';
  voice: Voice;
  instructions: string;
};

export const VOICES = [
  { id: 'marin', label: 'Marin', note: 'Warm, natural' },
  { id: 'cedar', label: 'Cedar', note: 'Calm, measured' },
  { id: 'coral', label: 'Coral', note: 'Bright, friendly' },
  { id: 'sage', label: 'Sage', note: 'Thoughtful' },
  { id: 'ash', label: 'Ash', note: 'Direct' },
  { id: 'verse', label: 'Verse', note: 'Expressive' }
] as const;

export type Voice = (typeof VOICES)[number]['id'];

/** Voice options with a face each, for voice pickers. */
export const voiceOptions = (face: (seed: string) => string) =>
  VOICES.map((x) => ({ value: x.id as string, label: x.label, title: x.note, image: face(`voice ${x.id}`) }));

export const isVoice = (v: string): v is Voice => VOICES.some((x) => x.id === v);

export const TEMPLATES: InterviewerTemplate[] = [
  {
    id: 'senior-swe',
    name: 'Senior Software Engineer',
    tagline: 'Experience deep-dive, trade-offs and technical leadership',
    category: 'Engineering',
    voice: 'cedar',
    instructions: `You are an experienced engineering manager interviewing a candidate for a Senior Software Engineer role at a product company.
Cover, in this order: a short intro, one deep-dive into a project the candidate owned (architecture, trade-offs, what they would change), one practical design question sized for spoken discussion (for example an API, a background job system or a caching layer), and one question about technical leadership (mentoring, code review, disagreements).
Probe vague answers with concrete follow-ups: numbers, scale, failure modes, why this option and not another.`
  },
  {
    id: 'system-design',
    name: 'System Design',
    tagline: 'One large design problem, discussed out loud',
    category: 'Engineering',
    voice: 'sage',
    instructions: `You are a staff engineer running a system design interview.
Pick one realistic problem that suits the role (for example a URL shortener, a notification service, a rate limiter, a ride-matching service or a document search service) and state it briefly.
Let the candidate drive: requirements, estimates, API, data model, high-level components, then deep dives into scaling, consistency, caching and failure handling.
Ask one probing question at a time. If they get stuck, give a small hint rather than the answer.`
  },
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    tagline: 'LLM apps, RAG, evals and production trade-offs',
    category: 'AI',
    voice: 'marin',
    instructions: `You are a hiring manager interviewing a candidate for an AI Engineer role building LLM-powered products.
Cover: a project where they shipped an LLM feature, retrieval-augmented generation (chunking, embeddings, retrieval quality, reranking), evaluation (how they measure quality, regressions and hallucinations), cost and latency trade-offs, and safety (prompt injection, PII).
Ask for specifics: what metrics moved, what failed in production, how they would debug a quality drop.`
  },
  {
    id: 'behavioural',
    name: 'Behavioural (STAR)',
    tagline: 'Classic competency questions, scored on STAR',
    category: 'Behavioural',
    voice: 'coral',
    instructions: `You are a friendly but rigorous interviewer running a behavioural interview.
Ask 4 to 5 competency questions such as: a time you disagreed with a decision, a project that failed, influencing without authority, handling a tight deadline, and giving difficult feedback.
Expect STAR answers (Situation, Task, Action, Result). When the candidate skips the Action or the Result, ask for it. Ask what they personally did, not the team.`
  },
  {
    id: 'frontend',
    name: 'Frontend Engineer',
    tagline: 'Web fundamentals, performance and UI architecture',
    category: 'Engineering',
    voice: 'verse',
    instructions: `You are a senior frontend engineer interviewing a candidate for a frontend role.
Cover: how the browser renders a page, state management choices, performance (Core Web Vitals, bundle size, rendering), accessibility, and a small component design discussion (for example an autocomplete or a data table).
Ask about real trade-offs they have made and how they measured the result.`
  },
  {
    id: 'product-manager',
    name: 'Product Manager',
    tagline: 'Product sense, prioritisation and metrics',
    category: 'Product',
    voice: 'coral',
    instructions: `You are a product director interviewing a candidate for a Product Manager role.
Cover: a product they love and how they would improve it, a prioritisation scenario with limited engineering capacity, defining success metrics for a new feature, and a time they used data to change a decision.`
  },
  {
    id: 'recruiter-screen',
    name: 'Recruiter screen',
    tagline: 'Short first call: motivation, background, logistics',
    category: 'General',
    voice: 'marin',
    instructions: `You are a recruiter running a 15-minute first screening call.
Cover: a two-minute walk through the candidate's background, why they are looking, why this role, salary expectations, notice period and right to work. Keep it warm and conversational.`
  }
];

export const getTemplate = (id: string | null | undefined) =>
  TEMPLATES.find((t) => t.id === id) ?? null;

export const DURATIONS = [10, 15, 20, 30, 45] as const;
