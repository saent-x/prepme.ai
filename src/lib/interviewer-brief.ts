/** Turns the short "New interviewer" form into the written brief the interviewer follows. */
export const STYLES = [
  { id: 'friendly', label: 'Friendly', line: 'Be warm and encouraging. Put the candidate at ease and give them room to think.' },
  { id: 'realistic', label: 'Neutral', line: 'Be professional and neutral, like a real interview. Ask follow-ups when an answer is vague.' },
  { id: 'tough', label: 'Tough', line: 'Be demanding. Challenge weak answers, push for specifics and evidence, and do not fill silences.' }
] as const;
export type StyleId = (typeof STYLES)[number]['id'];

export const FOCUS_AREAS = [
  { id: 'experience', label: 'Experience', line: 'their past experience and what they personally did' },
  { id: 'behavioural', label: 'Behavioural', line: 'behavioural questions answered with a situation, action and result' },
  { id: 'knowledge', label: 'Job knowledge', line: 'the knowledge and skills the job needs day to day' },
  { id: 'scenarios', label: 'Scenarios', line: 'realistic "what would you do if" situations from the job' },
  { id: 'motivation', label: 'Motivation', line: 'why they want this job and this employer' }
] as const;
export type FocusId = (typeof FOCUS_AREAS)[number]['id'];

export function composeBrief(f: { role: string; job: string; style: StyleId; focus: FocusId[] }) {
  const role = f.role.trim();
  const job = f.job.trim();
  const style = STYLES.find((s) => s.id === f.style) ?? STYLES[1];
  const focus = FOCUS_AREAS.filter((a) => f.focus.includes(a.id));
  const lines = [
    `You are ${job ? withArticle(job) : 'the hiring manager'} interviewing a candidate for this job: ${role || 'the role they describe'}.`,
    `Ask the questions a real interviewer for this job would ask, using the language of that job.`,
    focus.length ? `Cover: ${focus.map((a) => a.line).join('; ')}.` : '',
    style.line
  ];
  return lines.filter(Boolean).join('\n');
}

function withArticle(s: string) {
  if (/^(a|an|the)\s/i.test(s)) return s;
  return (/^[aeiou]/i.test(s) ? 'an ' : 'a ') + s;
}

/** One short line describing an agent, for lists and dropdowns. */
export function agentBlurb(instructions: string) {
  const job = instructions.match(/for this job:\s*(.+?)\.?\s*$/m)?.[1];
  if (job) return `Interviews you for ${job}`;
  const first = instructions.split(/\n/)[0]?.trim() ?? '';
  const line = first.replace(/^You are\s+/i, '');
  return line ? line.charAt(0).toUpperCase() + line.slice(1) : '';
}

/** The style an agent was made with, read back from its brief (Friendly / Neutral / Tough). */
export function agentStyle(instructions: string) {
  return STYLES.find((s) => instructions.includes(s.line))?.label ?? null;
}

/** Splits "Senior AI Engineer · Juro" (or "… at Juro") into role and company for list columns. */
export function splitTitle(name: string) {
  const m = name.match(/^(.+?)\s+(?:·|-|–|—|at|@)\s+(.+)$/);
  return m ? { role: m[1].trim(), company: m[2].trim() } : { role: name, company: '' };
}

/** The agent's own job ("Staff Engineer"), read from the first line of its brief. */
export function agentRole(instructions: string) {
  const who = instructions.match(/^You are\s+(.+?)\s+interviewing\b/i)?.[1];
  if (!who || /^the hiring manager$/i.test(who)) return null;
  const s = who.replace(/^(a|an|the)\s+/i, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
