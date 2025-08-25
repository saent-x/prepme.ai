import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs-svelte';
import { DEFAULT_PAGE } from '$lib/constant';
import { InterviewStatus } from '$lib/db/schema';

export const useInterviewsFilters = () => {
  return useQueryStates({
    search: parseAsString.withDefault('').withOptions({ clearOnDefault: true }),
    page: parseAsInteger.withDefault(DEFAULT_PAGE).withOptions({ clearOnDefault: true }),
    status: parseAsStringEnum(Object.values(InterviewStatus)),
    agentId: parseAsString.withDefault('').withOptions({ clearOnDefault: true })
  });
};
