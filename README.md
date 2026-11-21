# PrepMe

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/saent-x/prepme.ai?utm_source=oss&utm_medium=github&utm_campaign=saent-x%2Fprepme.ai&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

Mock interviews with an AI interviewer that joins a real video call and talks to you. You set up an interviewer agent (role, style, focus areas), start a call, and the agent interviews you by voice in real time. When the call ends, PrepMe turns the recording into a transcript, a structured summary with timestamped notes, and a chat where you can ask follow-up questions about how it went.

**Live:** [prepme-ai.vercel.app](https://prepme-ai.vercel.app)

## How it works

```
 you ──► Stream video call ◄── OpenAI Realtime voice agent (your interviewer's instructions)
                │
   call.session_ended ─► transcription + recording webhooks
                │
                ▼
   Inngest pipeline: fetch transcript ─► attribute speakers ─► GPT-4o summary agent ─► Postgres
                │
                ▼
   Post-interview chat: GPT-4o answers questions grounded in the summary + recent messages
```

- **Realtime voice interviewer.** On `call.session_started`, the webhook connects an OpenAI Realtime agent to the Stream call and loads the interviewer's custom instructions as its session prompt.
- **Durable post-processing.** Transcript handling runs as a multi-step Inngest function, so each step (fetch, parse JSONL, speaker lookup, summarise, save) retries on its own instead of failing the whole job.
- **Grounded follow-up chat.** Stream Chat messages hit a webhook that answers with GPT-4o, using the interview summary as context and the last five messages for continuity.
- **Product plumbing.** Better Auth (GitHub, Google, Microsoft sign-in), Polar subscriptions with free-tier limits, Drizzle ORM on Neon Postgres, deployed on Vercel.

## Stack

SvelteKit 5 · TypeScript · Tailwind CSS · Stream Video & Chat · OpenAI Realtime + GPT-4o · Inngest AgentKit · Drizzle ORM · Neon Postgres · Better Auth · Polar · Vercel

## Run it locally

```bash
bun install
cp .env.example .env   # then add OpenAI, Stream and Polar keys alongside the DB and OAuth ones
bun run db:push
bun run dev
```

Stream webhooks need a public URL to reach your machine; `bun run dev:webhook` starts an ngrok tunnel for that.

## Layout

| Path | What |
| --- | --- |
| `src/routes/api/webhook` | Stream video and chat webhooks (agent join, transcripts, chat replies) |
| `src/lib/inngest` | Transcript processing and summarisation pipeline |
| `src/lib/server` | Agents, interviews and premium-tier server logic |
| `src/lib/db` | Drizzle schema |
| `src/routes/dashboard` | Agents, interviews and upgrade pages |
| `src/routes/call/[interviewId]` | In-call experience |
