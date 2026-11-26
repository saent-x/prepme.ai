<script lang="ts">
  // A small progress ring for lists and stat strips (readiness, fit). The big score ring is ScoreRing.
  import { cn, scoreTone } from '$lib/utils';
  let {
    value,
    size = 36,
    stroke = 3,
    number = true,
    label = 'Readiness',
    class: className = ''
  }: { value: number | null; size?: number; stroke?: number; number?: boolean; label?: string; class?: string } = $props();

  const r = $derived((size - stroke) / 2);
  const c = $derived(2 * Math.PI * r);
  const pct = $derived(Math.max(0, Math.min(100, value ?? 0)) / 100);
  const tone = $derived(scoreTone(value));
  const colour = $derived(
    tone === 'good' ? 'var(--success)' : tone === 'ok' ? 'var(--warning)' : tone === 'low' ? 'var(--destructive)' : 'var(--track)'
  );
</script>

<span
  class={cn('relative inline-grid shrink-0 place-items-center', className)}
  style="width:{size}px;height:{size}px"
  role="img"
  aria-label="{label}: {value == null ? 'no score yet' : `${value} out of 100`}"
>
  <svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90" aria-hidden="true">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--track)" stroke-width={stroke} />
    {#if value != null}
      <circle
        cx={size / 2}
        cy={size / 2}
        {r}
        fill="none"
        stroke={colour}
        stroke-width={stroke}
        stroke-linecap="round"
        stroke-dasharray={c}
        stroke-dashoffset={c * (1 - pct)}
        style="--draw-from:{c};animation:draw 900ms cubic-bezier(.2,.8,.2,1) 150ms both"
      />
    {/if}
  </svg>
  {#if number}
    <span
      class="tabular absolute font-bold tracking-tight {value == null ? 'text-faint' : ''}"
      style="font-size:{Math.round(size * 0.3)}px;line-height:1"
      aria-hidden="true">{value ?? '–'}</span
    >
  {/if}
</span>
