<script lang="ts">
  import { cn, scoreTone } from '$lib/utils';
  let {
    score,
    size = 132,
    stroke = 10,
    label = 'Overall',
    class: className = ''
  }: { score: number | null; size?: number; stroke?: number; label?: string; class?: string } = $props();

  const r = $derived((size - stroke) / 2);
  const c = $derived(2 * Math.PI * r);
  const pct = $derived(Math.max(0, Math.min(100, score ?? 0)) / 100);
  const tone = $derived(scoreTone(score));
  const color = $derived(
    tone === 'good' ? 'var(--success)' : tone === 'ok' ? 'var(--warning)' : tone === 'low' ? 'var(--destructive)' : 'var(--border)'
  );
</script>

<div class={cn('relative inline-grid place-items-center', className)} style="width:{size}px;height:{size}px">
  <svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90" role="img" aria-label="{label} score {score ?? 'not available'} out of 100">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--track)" stroke-width={stroke} />
    <circle
      cx={size / 2}
      cy={size / 2}
      {r}
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-dasharray={c}
      stroke-dashoffset={c * (1 - pct)}
      style="--draw-from:{c};transition:stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1);animation:draw 900ms cubic-bezier(.2,.8,.2,1) 150ms both"
    />
  </svg>
  <div class="absolute inset-0 grid place-items-center text-center">
    <div>
      <div class="tabular font-extrabold tracking-tight" style="font-size:{Math.round(size * 0.22)}px;line-height:1">{score ?? '—'}</div>
      {#if label}<div class="mt-0.5 text-muted-foreground" style="font-size:{Math.max(11, size * 0.09)}px">{label}</div>{/if}
    </div>
  </div>
</div>
