import { DEFAULT_PAGE, MIN_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from '$lib/constant';
import { db } from '$lib/db/index.server';
import {
  agents,
  interviews,
  type InterviewCreateSchema,
  type InterviewGetSchema,
  type InterviewOneSchema
} from '$lib/db/schema';
import type { Context } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, count, desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm';
import z from 'zod/v4';

export async function updateOne(input: InterviewOneSchema, ctx: Context) {
  const [updatedInterview] = await db
    .update(interviews)
    .set(input)
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id ?? '')))
    .returning();

  if (!updatedInterview) {
    error(404, {
      message: 'Interview not found'
    });
  }

  return updatedInterview;
}

export async function deleteOne(input: InterviewGetSchema, ctx: Context) {
  const [deletedInterview] = await db
    .delete(interviews)
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id ?? '')))
    .returning();

  if (!deletedInterview) {
    error(404, {
      message: 'Interview not found'
    });
  }

  return deletedInterview;
}

export async function getOne(input: InterviewGetSchema, ctx: Context) {
  const [selectedInterview] = await db
    .select({
      ...getTableColumns(interviews)
    })
    .from(interviews)
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id ?? '')));

  if (!selectedInterview) {
    error(404, {
      message: 'Interview not found'
    });
  }

  return selectedInterview;
}

export const PaginationSchema = z.object({
  page: z.number().default(DEFAULT_PAGE),
  pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE).nullish(),
  search: z.string().nullish()
});

export async function listAll(input: z.infer<typeof PaginationSchema>, ctx: Context) {
  const { search, page, pageSize } = input;

  const data = await db
    .select({
      ...getTableColumns(interviews),
      agent: agents,
      duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as('duration')
    })
    .from(interviews)
    .innerJoin(agents, eq(interviews.agentId, agents.id))
    .where(
      and(
        eq(interviews.userId, ctx.session?.user.id ?? ''),
        search ? ilike(interviews.name, `%${search}%`) : undefined
      )
    )
    .orderBy(desc(interviews.createdAt), desc(interviews.id))
    .limit(pageSize!) // exclamation should be fine since pageSize has a default value
    .offset((page - 1) * pageSize!);

  const [total] = await db
    .select({ count: count() })
    .from(interviews)
    .innerJoin(agents, eq(interviews.agentId, agents.id))
    .where(
      and(
        eq(interviews.userId, ctx.session?.user.id ?? ''),
        search ? ilike(interviews.name, `%${search}%`) : undefined
      )
    );

  const totalPages = Math.ceil(total.count / pageSize!);

  return {
    items: data,
    total: total.count,
    totalPages
  };
}

export async function createOne(new_interview: InterviewCreateSchema, ctx: Context) {
  const [createdInterview] = await db
    .insert(interviews)
    .values({ ...new_interview, userId: ctx.session?.user.id ?? '' })
    .returning();

  // TODO: Create Stream Call, Upsert Stream Users

  return createdInterview;
}
