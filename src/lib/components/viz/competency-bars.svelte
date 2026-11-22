<script lang="ts">
  import { COMPETENCY_LABELS } from '$lib/interview-types';
  type Item = { key: string; score: number; evidence?: string };
  let { items, max = 5 }: { items: Item[]; max?: number } = $props();
  const label = (k: string) => COMPETENCY_LABELS[k as keyof typeof COMPETENCY_LABELS] ?? k;
  const colour = (s: number) => (s >= 4 ? 'bg-success' : s >= 3 ? 'bg-warning' : 'bg-destructive');
</script>

<ul class="divide-y">
  {#each items as item (item.key)}
    <li class="py-2.5 first:pt-0 last:pb-0">
      <div class="flex items-center gap-3">
        <span class="w-36 shrink-0 text-sm font-medium">{label(item.key)}</span>
        <span class="h-[5px] flex-1 rounded-full bg-muted" role="img" aria-label="{label(item.key)}: {item.score} out of {max}">
          <span class="block h-full rounded-full {colour(item.score)}" style="width:{(item.score / max) * 100}%"></span>
        </span>
        <span class="tabular w-8 text-right text-[13px] font-semibold">{#if item.score}{item.score}<span class="font-normal text-faint">/{max}</span>{:else}<span class="font-normal text-faint">—</span>{/if}</span>
      </div>
      {#if item.evidence}
        <p class="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.evidence}</p>
      {/if}
    </li>
  {/each}
</ul>
