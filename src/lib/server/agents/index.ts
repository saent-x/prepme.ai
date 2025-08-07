import { db } from '$lib/db/index.server';
import { agents } from '$lib/db/schema';
import { eq, getTableColumns, sql } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';

async function getOne(id: string) {
  const [selectedAgent] = await db
    .select({
      meetingCount: sql<number>`6`, // TODO: to be changed
      ...getTableColumns(agents)
    })
    .from(agents)
    .where(eq(agents.id, id));

  return selectedAgent;
}

async function listAll() {
  const data = await db.select().from(agents);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return data;
}

async function createOne(new_agent: InferInsertModel<typeof agents>) {
  const [createdAgent] = await db
    .insert(agents)
    .values({ ...new_agent })
    .returning();

  return createdAgent;
}
export const api = {
  getOne,
  listAll,
  createOne
};
