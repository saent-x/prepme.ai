import { env } from '$env/dynamic/private';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { streamVideo } from '$lib/server/stream-video';
import type { CallSessionParticipantLeftEvent, CallSessionStartedEvent } from '@stream-io/node-sdk';
import type { RequestHandler } from '@sveltejs/kit';
import { and, eq, not } from 'drizzle-orm';

function verifySignatureWithSDK(body: string, signature: string) {
  return streamVideo.verifyWebhook(body, signature);
}

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get('x-signature');
  const apiKey = request.headers.get('x-api-key');

  if (!signature || !apiKey) {
    return Response.json({ error: 'Missing signature or API key' }, { status: 400 });
  }

  const body = await request.text();

  if (!verifySignatureWithSDK(body, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === 'call.session_started') {
    const event = payload as CallSessionStartedEvent;
    const interviewId = event.call.custom?.interviewId as string;

    if (!interviewId) {
      return Response.json({ error: 'Missing interviewId' }, { status: 400 });
    }

    const [existingInterview] = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.id, interviewId),
          not(eq(interviews.status, 'completed')),
          not(eq(interviews.status, 'active')),
          not(eq(interviews.status, 'cancelled')),
          not(eq(interviews.status, 'processing'))
        )
      );

    if (!existingInterview) {
      return Response.json({ error: 'Interview not found' }, { status: 404 });
    }

    await db
      .update(interviews)
      .set({
        status: 'active',
        startedAt: new Date()
      })
      .where(eq(interviews.id, existingInterview.id));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingInterview.agentId));

    if (!existingAgent) {
      return Response.json({ error: 'Agent not found' }, { status: 404 });
    }

    const call = streamVideo.video.call('default', interviewId);
    const realtimeClient = await streamVideo.video.connectOpenAi({
      call,
      openAiApiKey: env.OPENAI_API_KEY,
      agentUserId: existingAgent.id
    });

    realtimeClient.updateSession({
      instructions: existingAgent.instructions
    });
  } else if (eventType === 'call.session_participant_left') {
    const event = payload as CallSessionParticipantLeftEvent;
    const interviewId = event.call_cid.split(':')[1];

    if (!interviewId) {
      return Response.json({ error: 'Missing interviewId' }, { status: 400 });
    }

    const call = streamVideo.video.call('default', interviewId);
    await call.end();
  }

  return Response.json({ status: 'ok' });
};