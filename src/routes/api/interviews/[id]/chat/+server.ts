import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { getInterviewOwned, listMessages } from '$lib/server/repo';
import { db } from '$lib/db/index.server';
import { interviewMessages } from '$lib/db/schema';
import { openai } from '$lib/server/openai';
import { config as appConfig } from '$lib/server/config';
import { buildChatSystemPrompt, formatTranscript } from '$lib/server/prompts';


const Body = z.object({ message: z.string().trim().min(1).max(4000) });

/** Follow-up coaching chat, streamed back as plain text. */
export const POST: RequestHandler = async (event) => {
  const user = requireUser(event);
  const parsed = Body.safeParse(await event.request.json().catch(() => null));
  if (!parsed.success) error(400, { message: 'Message is empty or too long.' });

  const interview = await getInterviewOwned(user.id, event.params.id);
  if (interview.status !== 'completed') error(409, { message: 'Chat opens once the interview is scored.' });

  const history = await listMessages(interview.id);
  await db
    .insert(interviewMessages)
    .values({ interviewId: interview.id, role: 'user', content: parsed.data.message });

  const instructions = buildChatSystemPrompt({
    interview,
    agentName: interview.agent.name,
    scorecardJson: interview.scorecard ? JSON.stringify(interview.scorecard) : null,
    transcriptText: formatTranscript(interview.transcript ?? [], user.name.split(' ')[0])
  });

  const stream = openai().responses.stream({
    model: appConfig.openai.chatModel(),
    instructions,
    input: [
      ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: parsed.data.message }
    ]
  });

  const encoder = new TextEncoder();
  let full = '';
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of stream) {
          if (ev.type === 'response.output_text.delta') {
            full += ev.delta;
            controller.enqueue(encoder.encode(ev.delta));
          }
        }
        if (full.trim()) {
          await db
            .insert(interviewMessages)
            .values({ interviewId: interview.id, role: 'assistant', content: full });
        }
        controller.close();
      } catch (e) {
        console.error('[chat] stream failed', e);
        controller.enqueue(encoder.encode('\n\n_Sorry, something went wrong. Please try again._'));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    }
  });

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
  });
};
