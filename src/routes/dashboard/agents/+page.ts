import { client, orpc } from '$lib/orpc';

export const load = async ({ parent }) => {
  const { queryClient } = await parent();

  queryClient.prefetchQuery(
    orpc.agents.list.queryOptions({
      queryKey: ['agents']
    })
  );

  return;
};
