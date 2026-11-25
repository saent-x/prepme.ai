<script lang="ts">
  import type { TranscriptEntry } from '$lib/interview-types';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { formatClock } from '$lib/utils';
  import { Download, Search } from '@lucide/svelte';

  let {
    transcript,
    interviewerName,
    candidateName,
    title
  }: { transcript: TranscriptEntry[]; interviewerName: string; candidateName: string; title: string } = $props();
  let q = $state('');
  const rows = $derived(
    q.trim() ? transcript.filter((t) => t.text.toLowerCase().includes(q.trim().toLowerCase())) : transcript
  );

  function download() {
    const text = transcript
      .map((t) => `[${formatClock(t.at)}] ${t.speaker === 'interviewer' ? interviewerName : candidateName}: ${t.text}`)
      .join('\n\n');
    const blob = new Blob([`${title}\n\n${text}\n`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[^\w\- ]+/g, '').trim() || 'interview'} transcript.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function mark(text: string) {
    const needle = q.trim();
    if (!needle) return [{ t: text, hit: false }];
    const out: { t: string; hit: boolean }[] = [];
    const lower = text.toLowerCase();
    const n = needle.toLowerCase();
    let i = 0;
    while (i < text.length) {
      const j = lower.indexOf(n, i);
      if (j === -1) {
        out.push({ t: text.slice(i), hit: false });
        break;
      }
      if (j > i) out.push({ t: text.slice(i, j), hit: false });
      out.push({ t: text.slice(j, j + n.length), hit: true });
      i = j + n.length;
    }
    return out;
  }
</script>

<div>
  <div class="flex flex-wrap items-center gap-3">
    <div class="relative flex-1">
      <Search class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search the transcript" class="pl-9" bind:value={q} aria-label="Search the transcript" />
    </div>
    <Button variant="outline" onclick={download} disabled={!transcript.length}><Download /> Download</Button>
  </div>

  {#if !transcript.length}
    <p class="py-10 text-center text-muted-foreground">No transcript was saved for this interview.</p>
  {:else}
    <ol class="mt-6 space-y-5">
      {#each rows as t (t.id)}
        <li class="flex gap-4 {t.speaker === 'candidate' ? 'flex-row-reverse text-right' : ''}">
          <span class="w-10 shrink-0 pt-1 tabular text-[11px] text-muted-foreground">{formatClock(t.at)}</span>
          <div class="max-w-[85%]">
            <div class="eyebrow mb-1">{t.speaker === 'interviewer' ? interviewerName : candidateName}</div>
            <p
              class="inline-block rounded-lg px-3.5 py-2 text-left text-sm leading-relaxed {t.speaker === 'candidate'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'}"
            >
              {#each mark(t.text) as part}{#if part.hit}<mark class="rounded bg-warning/40 px-0.5 text-inherit">{part.t}</mark>{:else}{part.t}{/if}{/each}
            </p>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</div>
