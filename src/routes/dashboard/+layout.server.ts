import type { LayoutServerLoad } from './$types';
import { requireUserPage } from '$lib/server/guard';
import { getUsageSummary } from '$lib/server/billing';
import { listInterviewers } from '$lib/server/repo';
import { FREE_LIMITS } from '$lib/server/config';
import { agentBlurb } from '$lib/interviewer-brief';
import { TEMPLATES } from '$lib/templates';

export const load: LayoutServerLoad = async (event) => {
  const user = requireUserPage(event);
  event.depends('app:usage');
  const [usage, agents] = await Promise.all([getUsageSummary(user.id), listInterviewers(user.id)]);
  const used = new Set(agents.map((a) => a.template).filter(Boolean));
  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    usage,
    // For the "New interview" pop-up, which opens from any dashboard page.
    newInterview: {
      agents: agents.map((a) => ({ id: a.id, name: a.name, blurb: agentBlurb(a.instructions) })),
      examples: TEMPLATES.filter((t) => !used.has(t.id)).map((t) => ({ id: `template:${t.id}`, name: t.name, blurb: t.tagline })),
      maxMinutes: usage.plan.premium ? 45 : FREE_LIMITS.maxMinutes
    }
  };
};
