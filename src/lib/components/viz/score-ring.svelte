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
    tone === 'good' ? 'var(--success)' : tone === 'ok' ? 'var(--warning)' : tone === 'low' ? 'var(--signal)' : 'var(--border)'
  );
</script>

<div class={cn('relative inline-grid place-items-center', className)} style="width:{size}px;height:{size}px">
  <svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90" role="img" aria-label="{label} score {score ?? 'not available'} out of 100">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--muted)" stroke-width={stroke} />
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
      style="transition: stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)"
    />
  </svg>
  <div class="absolute inset-0 grid place-items-center text-center">
    <div>
      <div class="tabular font-semibold tracking-tight" style="font-size:{size * 0.3}px;line-height:1">{score ?? '—'}</div>
      <div class="eyebrow mt-1" style="font-size:{Math.max(9, size * 0.075)}px">{label}</div>
    </div>
  </div>
</div>
