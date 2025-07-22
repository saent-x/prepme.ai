import type { InferRouterOutputs } from '@orpc/server';
import type { router } from '.';

export type AgentGetOne = InferRouterOutputs<typeof router>['agents']['getOne'];
export type ListAgents = InferRouterOutputs<typeof router>['agents']['list'];
export type CreateAgents = InferRouterOutputs<typeof router>['agents']['create'];
