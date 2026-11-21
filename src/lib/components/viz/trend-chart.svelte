<script lang="ts">
  import { format } from 'date-fns';
  type Point = { id: string; name: string; score: number; date: string };
  let { points, height = 180 }: { points: Point[]; height?: number } = $props();

  let width = $state(600);
  const pad = { t: 16, r: 16, b: 28, l: 32 };
  const innerW = $derived(Math.max(10, width - pad.l - pad.r));
  const innerH = $derived(height - pad.t - pad.b);
  const x = (i: number) => pad.l + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / 100) * innerH;
  const path = $derived(points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.score)}`).join(' '));
  const area = $derived(
    points.length > 1 ? `${path} L${x(points.length - 1)},${pad.t + innerH} L${x(0)},${pad.t + innerH} Z` : ''
  );
  let hover = $state<number | null>(null);
</script>

<div class="relative w-full" bind:clientWidth={width}>
  <svg {width} {height} role="img" aria-label="Score trend across {points.length} interviews">
    <defs>
      <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="var(--signal)" stop-opacity="0.22" />
        <stop offset="100%" stop-color="var(--signal)" stop-opacity="0" />
      </linearGradient>
    </defs>
    {#each [0, 50, 70, 100] as g}
      <line x1={pad.l} x2={pad.l + innerW} y1={y(g)} y2={y(g)} stroke="var(--border)" stroke-dasharray={g === 70 ? '4 4' : undefined} />
      <text x={pad.l - 8} y={y(g) + 4} text-anchor="end" class="fill-muted-foreground font-mono text-[10px]">{g}</text>
    {/each}
    <text x={pad.l + innerW} y={y(70) - 6} text-anchor="end" class="fill-muted-foreground font-mono text-[10px]">pass bar</text>
    {#if area}<path d={area} fill="url(#trend-fill)" />{/if}
    <path d={path} fill="none" stroke="var(--signal)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    {#each points as p, i (p.id)}
      <circle
        cx={x(i)}
        cy={y(p.score)}
        r={hover === i ? 6 : 4}
        fill="var(--card)"
        stroke="var(--signal)"
        stroke-width="2.5"
        role="presentation"
        onmouseenter={() => (hover = i)}
        onmouseleave={() => (hover = null)}
      />
    {/each}
    {#if points.length}
      <text x={x(0)} y={height - 8} text-anchor={points.length === 1 ? 'middle' : 'start'} class="fill-muted-foreground font-mono text-[10px]">{format(new Date(points[0].date), 'd MMM')}</text>
      {#if points.length > 1}
        <text x={x(points.length - 1)} y={height - 8} text-anchor="end" class="fill-muted-foreground font-mono text-[10px]">{format(new Date(points.at(-1)!.date), 'd MMM')}</text>
      {/if}
    {/if}
  </svg>
  {#if hover !== null}
    {@const p = points[hover]}
    <div
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"
      style="left:{x(hover)}px;top:{y(p.score) - 10}px"
    >
      <div class="font-medium">{p.name}</div>
      <div class="text-muted-foreground">{format(new Date(p.date), 'd MMM yyyy')} · <span class="tabular font-semibold text-foreground">{p.score}</span></div>
    </div>
  {/if}
</div>
