<script lang="ts">
  import { COMPETENCY_LABELS } from '$lib/interview-types';
  type Item = { key: string; score: number; evidence?: string };
  let { items, max = 5 }: { items: Item[]; max?: number } = $props();
  const label = (k: string) => COMPETENCY_LABELS[k as keyof typeof COMPETENCY_LABELS] ?? k;
</script>

<ul class="space-y-4">
  {#each items as item (item.key)}
    <li>
      <div class="mb-1.5 flex items-baseline justify-between gap-4">
        <span class="text-sm font-medium">{label(item.key)}</span>
        <span class="tabular font-mono text-xs text-muted-foreground">{item.score}/{max}</span>
      </div>
      <div class="flex gap-1" role="img" aria-label="{label(item.key)}: {item.score} out of {max}">
        {#each Array(max) as _, i}
          <span
            class="h-2 flex-1 rounded-full {i < Math.round(item.score)
              ? item.score >= 4
                ? 'bg-success'
                : item.score >= 3
                  ? 'bg-warning'
                  : 'bg-signal'
              : 'bg-muted'}"
          ></span>
        {/each}
      </div>
      {#if item.evidence}
        <p class="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{item.evidence}</p>
      {/if}
    </li>
  {/each}
</ul>
