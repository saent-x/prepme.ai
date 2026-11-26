/** Opens the "New interview" pop-up from anywhere in the dashboard. */
export const newInterview = $state({ open: false, agent: '', focus: '', job: '', round: '' });

export type NewInterviewPreset = {
  agent?: string | null;
  focus?: string | null;
  /** Practise for one of the user's jobs, and optionally one of its rounds. */
  job?: string | null;
  round?: string | null;
};

export function openNewInterview(preset: NewInterviewPreset = {}) {
  newInterview.agent = preset.agent ?? '';
  newInterview.focus = preset.focus ?? '';
  newInterview.job = preset.job ?? '';
  newInterview.round = preset.round ?? '';
  newInterview.open = true;
}
