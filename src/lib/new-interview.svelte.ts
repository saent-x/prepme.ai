/** Opens the "New interview" pop-up from anywhere in the dashboard. */
export const newInterview = $state({ open: false, agent: '', focus: '' });

export function openNewInterview(preset: { agent?: string | null; focus?: string | null } = {}) {
  newInterview.agent = preset.agent ?? '';
  newInterview.focus = preset.focus ?? '';
  newInterview.open = true;
}
