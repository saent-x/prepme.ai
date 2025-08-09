import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs-svelte';
import { DEFAULT_PAGE } from '$lib/constant';

export const useAgentsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true })
  });
};
