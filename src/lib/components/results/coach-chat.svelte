<script lang="ts">
  import Markdown from 'svelte-exmarkdown';
  import { gfmPlugin } from 'svelte-exmarkdown/gfm';
    import { Textarea } from '$lib/components/ui/textarea';
  import { Send, Sparkles } from '@lucide/svelte';
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

<div class="flex h-full min-h-[480px] flex-col overflow-hidden rounded-[10px] bg-muted">
  <div class="flex h-16 shrink-0 items-center gap-2 border-b px-6">
    <Sparkles class="size-5" strokeWidth={1.6} />
    <h2 class="text-base font-extrabold">Coach</h2>
  </div>
  <div bind:this={list} class="flex-1 space-y-5 overflow-y-auto px-6 py-5" aria-live="polite">
    {#if !messages.length}
      <div>
        <p class="text-sm text-muted-foreground">It has read your transcript and scores. Ask anything.</p>
        <div class="stagger mt-4 grid gap-2">
          {#each suggestions as s}
            <button class="rounded-[8px] border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-foreground/40" onclick={() => send(s)}>{s}</button>
          {/each}
        </div>
      </div>
    {:else}
      {#each messages as m (m.id)}
        <div class="animate-rise">
          <div class="flex items-center gap-2">
            {#if m.role === 'user'}
              <span class="grid size-6 place-items-center rounded-full bg-track text-[11px] font-bold">Y</span>
              <span class="text-xs font-bold">You</span>
            {:else}
              <span class="grid size-6 place-items-center rounded-full bg-foreground text-background"><Sparkles class="size-3.5" strokeWidth={1.8} /></span>
              <span class="text-xs font-bold">Coach</span>
            {/if}
          </div>
          <div class="mt-1.5 pl-8 text-sm leading-normal">
            {#if m.role === 'user'}
              <p>{m.content}</p>
            {:else if m.content}
              <div class="prose-lite text-sm"><Markdown md={m.content} {plugins} /></div>
            {:else}
              <span class="inline-flex gap-1"><span class="size-1.5 animate-bounce rounded-full bg-muted-foreground"></span><span class="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]"></span><span class="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]"></span></span>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
  <form
    class="p-6 pt-3"
    onsubmit={(e) => {
      e.preventDefault();
      send();
    }}
  >
    <div class="relative">
      <Textarea
        bind:value={draft}
        rows={1}
        placeholder="Ask a follow-up"
        class="max-h-40 min-h-10 resize-none py-2 pr-11"
        aria-label="Message"
        onkeydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />
      <button
        type="submit"
        class="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-[6px] text-muted-foreground hover:text-foreground disabled:opacity-40"
        disabled={busy || !draft.trim()}
        aria-label="Send"><Send class="size-4" strokeWidth={1.6} /></button
      >
    </div>
  </form>
</div>
