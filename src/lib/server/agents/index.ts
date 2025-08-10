import { DEFAULT_PAGE, MIN_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from '$lib/constant';
import { db } from '$lib/db/index.server';
import { agents } from '$lib/db/schema';
import type { Context } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, count, desc, eq, getTableColumns, ilike, sql } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import z from 'zod/v4';

export const GetOneSchema = z.object({
  id: z.string()
});
export async function getOne(input: z.infer<typeof GetOneSchema>, ctx: Context) {
  const [selectedAgent] = await db
    .select({
      meetingCount: sql<number>`6`, // TODO: to be changed
      ...getTableColumns(agents)
    })
    .from(agents)
    .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.session?.user.id ?? '')));

  if (!selectedAgent) {
    error(404, {
      message: 'Agent not found'
    });
  }

  return selectedAgent;
}

export const ListAllSchema = z.object({
  page: z.number().default(DEFAULT_PAGE),
  pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE).nullish(),
  search: z.string().nullish()
});

export async function listAll(input: z.infer<typeof ListAllSchema>, ctx: Context) {
  const { search, page, pageSize } = input;

  const data = await db
    .select()
    .from(agents)
    .where(
      and(
        eq(agents.userId, ctx.session?.user.id ?? ''),
        search ? ilike(agents.name, `%${search}%`) : undefined
      )
    )
    .orderBy(desc(agents.createdAt), desc(agents.id))
    .limit(pageSize!) // exclamation should be fine since pageSize has a default value
    .offset((page - 1) * pageSize!);

  const [total] = await db
    .select({ count: count() })
    .from(agents)
    .where(
      and(
        eq(agents.userId, ctx.session?.user.id ?? ''),
        search ? ilike(agents.name, `%${search}%`) : undefined
      )
    );

  const totalPages = Math.ceil(total.count / pageSize!);

  return {
    items: data,
    total: total.count,
    totalPages
  };
}

export async function createOne(new_agent: InferInsertModel<typeof agents>) {
  const [createdAgent] = await db
    .insert(agents)
    .values({ ...new_agent })
    .returning();

  return createdAgent;
}
