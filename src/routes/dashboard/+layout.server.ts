import type { LayoutServerLoad } from './$types';
import { requireUserPage } from '$lib/server/guard';
import { getUsageSummary } from '$lib/server/billing';

export const load: LayoutServerLoad = async (event) => {
  const user = requireUserPage(event);
  event.depends('app:usage');
  return {
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    usage: await getUsageSummary(user.id)
  };
};
