import { env } from '$env/dynamic/private';
import { OPENAI_API_KEY } from '$env/static/private';
import { generateAvatarUri } from '$lib/components/shared/avatar-gen.svelte';
import { db } from '$lib/db/index.server';
import { agents, interviews } from '$lib/db/schema';
import { inngest } from '$lib/inngest';
import { streamVideo } from '$lib/server/stream-video';
import { streamChat } from '$lib/stream-chat';
import type {
  CallEndedEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
  MessageNewEvent
} from '@stream-io/node-sdk';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq, not } from 'drizzle-orm';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

const openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });

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
  } else if (eventType === 'message.new') {
    await handleNewMessage(payload as MessageNewEvent);
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
    return json({ error: 'interview not found' }, { status: 404 });
  }
}

async function handleNewMessage(event: MessageNewEvent) {
  const userId = event.user?.id;
  const channelId = event.channel_id;
  const text = event.message?.text;

  if (!userId || !channelId || !text) {
    return json({ error: 'Required fields missing' }, { status: 400 });
  }

  const [existingInterview] = await db
    .select()
    .from(interviews)
    .where(and(eq(interviews.id, channelId), eq(interviews.status, 'completed')));

  if (!existingInterview) {
    return json({ error: 'interview not found' }, { status: 404 });
  }

  const [existingAgent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, existingInterview.agentId));

  if (!existingAgent) {
    return json({ error: 'agent not found' }, { status: 404 });
  }

  if (userId !== existingAgent.id) {
    const instructions = `
    You are an AI assistant helping the user revisit a recently completed meeting.
    Below is a summary of the meeting, generated from the transcript:

    ${existingInterview.summary}

    The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:

    ${existingAgent.instructions}

    The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
    Always base your responses on the meeting summary above.

    You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

    If the summary does not contain enough information to answer a question, politely let the user know.

    Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
    `;

    const channel = streamChat.channel('messaging', channelId);
    await channel.watch();

    const previousMessages = channel.state.messages
      .slice(-5)
      .filter((msg) => msg.text && msg.text.trim() !== '')
      .map<ChatCompletionMessageParam>((message) => ({
        role: message.user?.id === existingAgent.id ? 'assistant' : 'user',
        content: message.text || ''
      }));

    const AIResponse = await openaiClient.chat.completions.create({
      messages: [
        { role: 'system', content: instructions },
        ...previousMessages,
        { role: 'user', content: text }
      ],
      model: 'gpt-4o'
    });

    const AIResponseText = AIResponse.choices[0].message.content;

    if (!AIResponseText) {
      return json({ error: 'No response from GPT' }, { status: 400 });
    }

    const agentUser = {
      id: existingAgent.id,
      name: existingAgent.name,
      image: generateAvatarUri('botttsNeutral', existingAgent.name)
    };

    streamChat.upsertUser(agentUser);
    channel.sendMessage({
      text: AIResponseText,
      user: agentUser
    });
  }
}
