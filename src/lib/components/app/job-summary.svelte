<script lang="ts">
  import type { JobSummary } from '$lib/job-parse';
  import { Banknote, Building2, Check, Clock, MapPin, Pencil } from '$lib/icons';

  let { job, onedit }: { job: JobSummary; onedit?: () => void } = $props();

  const facts = $derived(
    [
      { icon: MapPin, text: [job.location, job.workMode].filter(Boolean).join(' · ') },
      { icon: Clock, text: job.contract },
      { icon: Banknote, text: job.salary }
    ].filter((f) => f.text)
  );
</script>

<div class="rounded-lg border bg-card">
  <div class="flex items-start gap-3 px-3.5 pt-3">
    <div class="min-w-0 flex-1">
      <div class="truncate text-[15px] font-bold">{job.title}</div>
      {#if job.company}
        <div class="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Building2 class="size-3.5 shrink-0" /><span class="truncate">{job.company}</span>
        </div>
      {/if}
    </div>
    {#if onedit}
      <button type="button" class="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground" onclick={onedit}>
        <Pencil class="size-3" /> Edit
      </button>
    {/if}
  </div>

  {#if facts.length}
    <div class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 px-3.5 text-[13px]">
      {#each facts as f}
        <span class="flex items-center gap-1.5"><f.icon class="size-3.5 shrink-0 text-faint" />{f.text}</span>
      {/each}
    </div>
  {/if}

  {#if job.skills.length}
    <div class="mt-3 flex flex-wrap gap-1.5 px-3.5">
      {#each job.skills as s}
        <span class="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{s}</span>
      {/each}
    </div>
  {/if}

  {#if job.responsibilities.length || job.requirements.length}
    <div class="mt-3 grid gap-x-5 gap-y-3 border-t px-3.5 py-3 sm:grid-cols-2">
      {#each [{ label: "What you'll do", items: job.responsibilities }, { label: 'What they want', items: job.requirements }] as col}
        {#if col.items.length}
          <div>
            <div class="eyebrow">{col.label}</div>
            <ul class="mt-1.5 grid gap-1.5 text-[13px] leading-snug">
              {#each col.items as item}
                <li class="flex gap-1.5"><Check class="mt-0.5 size-3.5 shrink-0 text-success" />{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="h-3"></div>
  {/if}
</div>
