import { DEFAULT_PAGE, MIN_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from '$lib/constant';
import { db } from '$lib/db/index.server';
import {
  agents,
  interviews,
  InterviewStatus,
  user,
  type InterviewCreateSchema,
  type InterviewGetSchema,
  type InterviewOneSchema,
  type StreamTranscriptItem
} from '$lib/db/schema';
import { parseJSONL, type Context } from '$lib/utils';
import { error } from '@sveltejs/kit';
import { and, count, desc, eq, getTableColumns, ilike, inArray, sql } from 'drizzle-orm';
import z from 'zod/v4';
import { streamVideo } from '../stream-video';
import { generateAvatarUri } from '$lib/components/shared/avatar-gen.svelte';
import { streamChat } from '$lib/stream-chat';
import { CheckSubscription } from '../premium';

export async function generateChatToken(ctx: Context): Promise<string> {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const token = streamChat.createToken(ctx.session?.user.id);

  await streamChat.upsertUser({
    id: ctx.session?.user.id,
    role: 'admin'
  });

  return token;
}

export async function getTranscript(input: InterviewGetSchema, ctx: Context) {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const [existingInterview] = await db
    .select()
    .from(interviews)
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id)));

  if (!existingInterview) {
    error(404, {
      message: 'Interview not found'
    });
  }

  if (!existingInterview.transcriptUrl) {
    return [];
  }

  const transcript = await fetch(existingInterview.transcriptUrl)
    .then((res) => res.text())
    .then((text) => parseJSONL<StreamTranscriptItem>(text))
    .catch(() => {
      return [];
    });

  const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

  const userSpeakers = await db
    .select()
    .from(user)
    .where(inArray(user.id, speakerIds))
    .then((users) =>
      users.map((user) => ({
        ...user,
        image: user.image ?? generateAvatarUri('initials', user.name)
      }))
    );

  const agentsSpeakers = await db
    .select()
    .from(agents)
    .where(inArray(agents.id, speakerIds))
    .then((agents) =>
      agents.map((agent) => ({
        ...agent,
        image: generateAvatarUri('botttsNeutral', agent.name)
      }))
    );

  const speakers = [...userSpeakers, ...agentsSpeakers];

  return transcript.map((item) => {
    const speaker = speakers.find((speaker) => speaker.id === item.speaker_id);

    if (!speaker) {
      return {
        ...item,
        user: {
          name: 'Unknown',
          image: generateAvatarUri('initials', 'Unknown')
        }
      };
    }

    return {
      ...item,
      user: {
        name: speaker.name,
        image: speaker.image
      }
    };
  });
}

export async function generateToken(ctx: Context): Promise<string> {
  try {
    if (!ctx.session) {
      error(401, {
        message: 'Unauthorized'
      });
    }

    await streamVideo.upsertUsers([
      {
        id: ctx.session?.user.id,
        name: ctx.session?.user.name,
        role: 'admin',
        image: ctx.session?.user.image ?? generateAvatarUri('initials', ctx.session?.user.name)
      }
    ]);

    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const issuedAt = Math.floor(Date.now() / 1000) - 60;

    const token = streamVideo.generateUserToken({
      user_id: ctx.session?.user.id,
      exp: expirationTime,
      validity_in_seconds: issuedAt
    });

    return token;
  } catch {
    return error(400, { message: 'Error generating token' });
  }
}

export async function updateOne(
  input: Pick<InterviewOneSchema, 'id' | 'name' | 'agentId'>,
  ctx: Context
) {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const [updatedInterview] = await db
    .update(interviews)
    .set(input)
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id)))
    .returning();

  if (!updatedInterview) {
    error(404, {
      message: 'Interview not found'
    });
  }

  return updatedInterview;
}

export async function deleteOne(input: InterviewGetSchema, ctx: Context) {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const [deletedInterview] = await db
    .delete(interviews)
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id)))
    .returning();

  if (!deletedInterview) {
    error(404, {
      message: 'Interview not found'
    });
  }

  return deletedInterview;
}

export async function getOne(input: InterviewGetSchema, ctx: Context) {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const [selectedInterview] = await db
    .select({
      ...getTableColumns(interviews),
      agent: agents,
      duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as('duration')
    })
    .from(interviews)
    .innerJoin(agents, eq(interviews.agentId, agents.id))
    .where(and(eq(interviews.id, input.id), eq(interviews.userId, ctx.session?.user.id)));

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
  search: z.string().nullish(),
  agentId: z.string().nullish(),
  status: z.enum(InterviewStatus).nullish()
});

export async function listAll(input: z.infer<typeof PaginationSchema>, ctx: Context) {
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }

  const { search, page, pageSize, status, agentId } = input;

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
        eq(interviews.userId, ctx.session?.user.id),
        search ? ilike(interviews.name, `%${search}%`) : undefined,
        status ? eq(interviews.status, status) : undefined,
        agentId ? eq(interviews.agentId, agentId) : undefined
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
        eq(interviews.userId, ctx.session?.user.id),
        search ? ilike(interviews.name, `%${search}%`) : undefined,
        status ? eq(interviews.status, status) : undefined,
        agentId ? eq(interviews.agentId, agentId) : undefined
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
  if (!ctx.session || !ctx.session.user.id) {
    error(401, {
      message: 'Unauthorized'
    });
  }
  
  await CheckSubscription(ctx, 'interview');

  const [createdInterview] = await db
    .insert(interviews)
    .values({ ...new_interview, userId: ctx.session?.user.id })
    .returning();

  const call = streamVideo.video.call('default', createdInterview.id);
  await call.create({
    data: {
      created_by_id: ctx.session?.user.id,
      custom: {
        interviewId: createdInterview.id,
        interviewName: createdInterview.name
      },
      settings_override: {
        transcription: {
          language: 'en',
          mode: 'auto-on',
          closed_caption_mode: 'auto-on'
        },
        recording: {
          mode: 'auto-on',
          quality: '1080p'
        }
      }
    }
  });

  const [existingAgent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, createdInterview.agentId));

  if (!existingAgent) {
    error(404, {
      message: 'Agent not found'
    });
  }

  await streamVideo.upsertUsers([
    {
      id: existingAgent.id,
      name: existingAgent.name,
      role: 'user',
      image: generateAvatarUri('botttsNeutral', existingAgent.name)
    }
  ]);

  return createdInterview;
}
