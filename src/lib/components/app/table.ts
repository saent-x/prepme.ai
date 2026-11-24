/**
 * One table look for the whole app (Home, Interviews, Agents, agent page).
 * Header 32px, rows 48px, hairline dividers, 12px inset, grey on hover.
 */
export const TABLE_HEAD = 'h-8 items-center gap-x-4 border-b px-3 text-xs font-bold text-muted-foreground';
export const TABLE_ROW = 'group grid h-12 items-center gap-x-4 border-b px-3 text-sm transition-colors hover:bg-muted';

/** Interview table columns. `home` drops agent and length, `agent` drops the agent column. */
export type InterviewCols = 'full' | 'home' | 'agent';
export const INTERVIEW_GRID: Record<InterviewCols, string> = {
  full: 'sm:grid-cols-[20px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_64px_56px_48px_20px]',
  home: 'sm:grid-cols-[20px_minmax(0,1.4fr)_minmax(0,1fr)_64px_48px_20px]',
  agent: 'sm:grid-cols-[20px_minmax(0,1.4fr)_minmax(0,1fr)_64px_56px_48px_20px]'
};

/** Agents table: face + name, role, style, interviews, chevron. */
export const AGENT_GRID = 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_96px_80px_20px]';
