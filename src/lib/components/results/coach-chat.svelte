<script lang="ts">
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { ArrowUp } from '@lucide/svelte';
  import { tick, untrack } from 'svelte';

  type Msg = { id: string; role: 'user' | 'assistant'; content: string };
  let { interviewId, initial }: { interviewId: string; initial: Msg[] } = $props();

  let messages = $state<Msg[]>(untrack(() => initial.slice()));
  let draft = $state('');
  let busy = $state(false);
  let list: HTMLDivElement | undefined = $state();
  const plugins = [gfmPlugin()];

  const suggestions = [
    'Which answer hurt my score the most, and why?',
    'Rewrite my weakest answer using STAR.',
    'What follow-up questions should I expect next time?',
    'Give me a 3-day practice plan based on this.'
  ];

  async function scroll() {
    await tick();
    list?.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }

  async function send(text = draft) {
    const message = text.trim();
    if (!message || busy) return;
    draft = '';
    busy = true;
    messages.push({ id: crypto.randomUUID(), role: 'user', content: message });
    messages.push({ id: crypto.randomUUID(), role: 'assistant', content: '' });
    const reply = messages[messages.length - 1];
    await scroll();
    try {
      const res = await fetch(`/api/interviews/${interviewId}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        reply.content = body?.message ?? 'Something went wrong. Please try again.';
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply.content += dec.decode(value, { stream: true });
        void scroll();
      }
    } catch {
      reply.content = 'Network error. Please try again.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="flex h-[min(70vh,680px)] flex-col overflow-hidden rounded-xl border bg-card">
  <div bind:this={list} class="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6" aria-live="polite">
    {#if !messages.length}
      <div class="grid h-full place-items-center text-center">
        <div class="max-w-md">
          <h3 class="font-bold">Ask your coach</h3>
          <p class="mt-1 text-sm text-muted-foreground">It has read your transcript and scorecard.</p>
          <div class="mt-6 grid gap-2">
            {#each suggestions as s}
              <button class="rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent" onclick={() => send(s)}>{s}</button>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      {#each messages as m (m.id)}
        {#if m.role === 'user'}
          <div class="flex justify-end"><p class="max-w-[85%] rounded-lg bg-primary px-3.5 py-2 text-sm text-primary-foreground">{m.content}</p></div>
        {:else}
          <div class="prose-lite max-w-[92%]">
            {#if m.content}<Markdown md={m.content} {plugins} />{:else}<span class="inline-flex gap-1"><span class="size-1.5 animate-bounce rounded-full bg-muted-foreground"></span><span class="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]"></span><span class="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]"></span></span>{/if}
          </div>
        {/if}
      {/each}
    {/if}
  </div>
  <form
    class="flex items-end gap-2 border-t p-3"
    onsubmit={(e) => {
      e.preventDefault();
      send();
    }}
  >
    <Textarea
      bind:value={draft}
      rows={1}
      placeholder="Ask about your interview…"
      class="max-h-40 min-h-11 resize-none rounded-lg"
      aria-label="Message"
      onkeydown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      }}
    />
    <Button type="submit" size="icon" class="size-11 shrink-0" disabled={busy || !draft.trim()} aria-label="Send"><ArrowUp /></Button>
  </form>
</div>
