import { env } from '$env/dynamic/private';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { inngest } from '$lib/inngest';
import { streamVideo } from '$lib/server/stream-video';
import type {
  CallEndedEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent
} from '@stream-io/node-sdk';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, not } from 'drizzle-orm';

function verifySignatureWithSDK(body: string, signature: string) {
  return streamVideo.verifyWebhook(body, signature);
}

export const POST: RequestHandler = async ({ request }) => {
  const signature = request.headers.get('x-signature');
  const apiKey = request.headers.get('x-api-key');

  if (!signature || !apiKey) {
    return json({ error: 'Missing signature or API key' }, { status: 400 });
  }

  const body = await request.text();

  if (!verifySignatureWithSDK(body, signature)) {
    return json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  if (eventType === 'call.session_started') {
    await handleSessionStartedEvent(payload as CallSessionStartedEvent);
  } else if (eventType === 'call.session_participant_left') {
    await handleSessionParticipantLeft(payload as CallSessionParticipantLeftEvent);
  } else if (eventType === 'call.session_ended') {
    await handleSessionEnded(payload as CallEndedEvent);
  } else if (eventType === 'call.transcription_ready') {
    await handleTranscriptionReady(payload as CallTranscriptionReadyEvent);
  } else if (eventType === 'call.recording_ready') {
    await handleRecordingReady(payload as CallRecordingReadyEvent);
  }

  return json({ status: 'ok' });
};

async function handleSessionStartedEvent(event: CallSessionStartedEvent) {
  const interviewId = event.call.custom?.interviewId as string;

  if (!interviewId) {
    return json({ error: 'Missing interviewId' }, { status: 400 });
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
    return json({ error: 'Interview not found' }, { status: 404 });
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
    return json({ error: 'Agent not found' }, { status: 404 });
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
}

async function handleSessionParticipantLeft(event: CallSessionParticipantLeftEvent) {
  const interviewId = event.call_cid.split(':')[1];

  if (!interviewId) {
    return json({ error: 'Missing interviewId' }, { status: 400 });
  }

  const call = streamVideo.video.call('default', interviewId);
  await call.end();
}

async function handleSessionEnded(event: CallEndedEvent) {
  const interviewId = event.call.custom?.interviewId;

  await db
    .update(interviews)
    .set({
      status: 'processing',
      endedAt: new Date()
    })
    .where(and(eq(interviews.id, interviewId), eq(interviews.status, 'active')));
}

async function handleTranscriptionReady(event: CallTranscriptionReadyEvent) {
  const interviewId = event.call_cid.split(':')[1];

  const [updatedInterview] = await db
    .update(interviews)
    .set({
      transcriptUrl: event.call_transcription.url
    })
    .where(eq(interviews.id, interviewId))
    .returning();

  // Call ingest to summarize transcriptUrl

  if (!updatedInterview) {
    return json({ error: 'meeting not found' }, { status: 404 });
  }

  return json({ status: 'ok' });
}

async function handleRecordingReady(event: CallRecordingReadyEvent) {
  const interviewId = event.call_cid.split(':')[1];

  const [updatedInterview] = await db
    .update(interviews)
    .set({
      recordingUrl: event.call_recording.url
    })
    .where(eq(interviews.id, interviewId))
    .returning();

  if (!updatedInterview) {
    return json({ error: 'meeting not found' }, { status: 404 });
  }

  await inngest.send({
    name: 'interviews/processing',
    data: {
      interviewId: updatedInterview.id,
      transcriptUrl: updatedInterview.transcriptUrl
    }
  });
}
