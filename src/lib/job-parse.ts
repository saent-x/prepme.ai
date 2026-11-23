import { z } from 'zod';

/** What we pull out of a pasted job description to show it back in an organised way. */
export const JobSummarySchema = z.object({
  title: z.string().describe('Job title, e.g. "Software Engineer". Empty string if not stated.'),
  company: z.string().describe('Employer name. Empty string if not stated.'),
  location: z.string().describe('Place of work, e.g. "London". Empty string if not stated.'),
  workMode: z.string().describe('"Remote", "Hybrid" or "On-site". Empty string if not stated.'),
  contract: z.string().describe('e.g. "Full-time", "Permanent", "Contract". Empty string if not stated.'),
  salary: z.string().describe('Pay as written, e.g. "£55,000 to £65,000". Empty string if not stated.'),
  skills: z.array(z.string()).describe('Up to 10 named skills, tools or qualifications, 1 to 3 words each.'),
  responsibilities: z.array(z.string()).describe('Up to 5 things the person will do, each under 14 words.'),
  requirements: z.array(z.string()).describe('Up to 5 things the employer asks for, each under 14 words.')
});
export type JobSummary = z.infer<typeof JobSummarySchema>;

/** Too short to be a job description worth organising. */
export const MIN_JOB_TEXT = 200;

const SKILLS = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'SQL',
  'React', 'Svelte', 'Vue', 'Angular', 'Next.js', 'Node.js', '.NET', 'Django', 'Flask', 'FastAPI', 'Spring',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Git', 'Linux', 'PostgreSQL', 'MySQL',
  'MongoDB', 'Redis', 'Kafka', 'GraphQL', 'REST', 'Microservices', 'Machine learning', 'LLM', 'RAG', 'PyTorch',
  'TensorFlow', 'Agile', 'Scrum', 'TDD', 'Excel', 'Power BI', 'Tableau', 'Salesforce', 'SAP', 'Figma',
  'Project management', 'Stakeholder management', 'Customer service', 'Communication', 'Leadership', 'Teamwork',
  'Budgeting', 'Negotiation', 'Safeguarding', 'NMC registration', 'Driving licence', 'First aid', 'DBS check',
  'Sales', 'Marketing', 'SEO', 'Copywriting', 'Data analysis', 'Accounting', 'Payroll'
];

const HEAD_DO = /responsibilit|what you(?:'|’)?(?:ll| will) (?:do|be doing)|duties|day to day|day-to-day|key tasks/i;
const HEAD_WANT =
  /requirement|looking for|about you|what you(?:'|’)?(?:ll| will) (?:need|bring|have)|skills|experience|qualification|essential|desirable|who you are|you (?:have|are)\b/i;

const clean = (s: string) => s.replace(/^\s*(?:[•●▪◦*·\-–—>]+|\d{1,2}[.)])\s*/, '').replace(/\s+/g, ' ').trim();
const isHeading = (line: string) => {
  const t = line.trim();
  return t.length > 2 && t.length <= 60 && !/[.!?]$/.test(t) && (/:$/.test(t) || !/^[\s]*[•●▪◦*·\-–—]/.test(line));
};
const shorten = (s: string, words = 16) => {
  const w = s.split(' ');
  return w.length > words ? w.slice(0, words).join(' ') + '…' : s;
};

/**
 * Best-effort reading of a job description without a model. Used when the
 * model is unavailable, so the organised view still appears.
 */
export function parseJobBasic(text: string): JobSummary {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd());
  const filled = lines.map((l) => l.trim()).filter(Boolean);
  const labelled = (re: RegExp) => {
    for (const l of filled) {
      const m = l.match(re);
      if (m) return clean(m[1]).slice(0, 80);
    }
    return '';
  };

  let title = labelled(/^(?:job\s*title|position|role)\s*[:\-–]\s*(.+)$/i);
  let company = labelled(/^(?:company|employer|organisation|organization)\s*[:\-–]\s*(.+)$/i);
  const first = filled[0] ?? '';
  if (!title && first.length <= 90) {
    // "Software Engineer at Acme" or "Software Engineer - Acme"
    const m = first.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    if (m) {
      title = clean(m[1]);
      company ||= clean(m[2]);
    } else title = clean(first);
  }
  if (!company) {
    const m = text.match(/\b(?:at|join|joining)\s+([A-Z][\w&'.-]*(?:\s+[A-Z][\w&'.-]*){0,3})\b/);
    if (m && !/^(The|Our|A|An|Us)$/.test(m[1])) company = m[1];
  }

  const salary =
    text.match(
      /[£$€]\s?\d[\d,.]*\s?[kK]?(?:\s?(?:-|–|—|to)\s?[£$€]?\s?\d[\d,.]*\s?[kK]?)?(?:\s?(?:per|a|\/|p\.?)\s?(?:year|annum|a\.?|hour|day|month))?/
    )?.[0] ?? '';
  const workMode = /\bhybrid\b/i.test(text) ? 'Hybrid' : /\b(?:fully )?remote\b/i.test(text) ? 'Remote' : /\bon-?site\b|\bin[- ]office\b/i.test(text) ? 'On-site' : '';
  const contract = (text.match(/\b(full[- ]time|part[- ]time|permanent|fixed[- ]term|contract|temporary|internship|apprenticeship)\b/i)?.[1] ?? '').replace(/^./, (c) => c.toUpperCase());
  const location = labelled(/^(?:location|based in|office)\s*[:\-–]\s*(.+)$/i);

  // Walk the sections: a heading switches the bucket, bullets and sentences fill it.
  const responsibilities: string[] = [];
  const requirements: string[] = [];
  let bucket: string[] | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (isHeading(raw)) {
      bucket = HEAD_DO.test(line) ? responsibilities : HEAD_WANT.test(line) ? requirements : null;
      continue;
    }
    const item = clean(line);
    if (bucket && item.length >= 12 && bucket.length < 5) bucket.push(shorten(item));
  }

  const lower = text.toLowerCase();
  const skills = SKILLS.filter((s) => {
    const k = s.toLowerCase();
    const i = lower.indexOf(k);
    if (i === -1) return false;
    // Whole-word match, so "Go" does not match "good".
    const before = lower[i - 1] ?? ' ';
    const after = lower[i + k.length] ?? ' ';
    return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
  }).slice(0, 10);

  return { title: title.slice(0, 90), company: company.slice(0, 60), location, workMode, contract, salary: salary.trim(), skills, responsibilities, requirements };
}

/** Trim model output to the sizes the UI is designed for. */
export function tidyJobSummary(s: JobSummary): JobSummary {
  const str = (v: string, n: number) => v.trim().slice(0, n);
  const list = (v: string[], n: number, len: number) => v.map((x) => str(x, len)).filter(Boolean).slice(0, n);
  // "Manchester (Hybrid)" plus a Hybrid work mode would say it twice.
  const mode = str(s.workMode, 20);
  const location = mode
    ? s.location.replace(new RegExp(`[\\s,·/-]*\\(?\\b${mode.replace(/[^a-z]/gi, '.?')}\\b\\)?`, 'i'), '')
    : s.location;
  return {
    title: str(s.title, 90),
    company: str(s.company, 60),
    location: str(location, 60),
    workMode: str(s.workMode, 20),
    contract: str(s.contract, 30),
    salary: str(s.salary, 60),
    skills: list(s.skills, 10, 32),
    responsibilities: list(s.responsibilities, 5, 140),
    requirements: list(s.requirements, 5, 140)
  };
}

/** True when there is enough in the summary to be worth showing. */
export const hasJobSummary = (s: JobSummary) =>
  Boolean(s.title) && (s.skills.length > 0 || s.responsibilities.length > 0 || s.requirements.length > 0 || Boolean(s.salary || s.company));
