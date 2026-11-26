<script lang="ts" module>
  export type PathStep = {
    key: string;
    title: string;
    meta: string;
    /** done = practised, current = the one to practise next, todo = later, goal = the real interview. */
    state: 'done' | 'current' | 'todo' | 'goal';
    score?: number | null;
    /** Where "Practise" goes. Left out on the goal and on previews. */
    href?: string;
  };
</script>

<script lang="ts">
  // The rounds of a hiring process as a path: done rounds are ticked, the next one glows, the real interview is the flag.
  import { Button } from '$lib/components/ui/button';
  import ScoreChip from './score-chip.svelte';
  import { Check, FlagCheckered, Mic } from '$lib/icons';

  let { steps }: { steps: PathStep[] } = $props();
</script>

<ol class="path">
  {#each steps as step (step.key)}
    <li class="step is-{step.state}">
      <span class="node" aria-hidden="true">
        {#if step.state === 'done'}<Check weight="bold" class="size-3.5" />{:else if step.state === 'goal'}<FlagCheckered class="size-3.5" />{:else}<Mic class="size-3.5" />{/if}
      </span>
      <div class="flex min-w-0 items-start justify-between gap-3 pt-0.5">
        <div class="min-w-0">
          <div class="text-[13px] leading-5 font-semibold">{step.title}</div>
          <div class="text-xs text-muted-foreground">{step.meta}</div>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          {#if step.state === 'done'}<ScoreChip score={step.score} />{/if}
          {#if step.href && step.state === 'current'}
            <Button href={step.href} size="sm">Practise</Button>
          {:else if step.href}
            <a href={step.href} class="link text-xs">{step.state === 'done' ? 'Again' : 'Practise'}</a>
          {/if}
        </div>
      </div>
    </li>
  {/each}
</ol>

<style>
  .path {
    display: grid;
  }
  .step {
    position: relative;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 10px;
    padding-bottom: 14px;
  }
  .step:last-child {
    padding-bottom: 0;
  }
  /* The line to the next round: dotted until this round is done. */
  .step::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 26px;
    bottom: 2px;
    border-left: 2px dotted var(--border);
  }
  .step:last-child::before {
    display: none;
  }
  .step.is-done::before {
    border-left-style: solid;
    border-color: var(--success);
  }
  .node {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: var(--faint);
    background: var(--background);
    box-shadow: inset 0 0 0 1.5px var(--border);
  }
  .is-done .node {
    color: #fff;
    background: var(--success);
    box-shadow: none;
  }
  .is-current .node {
    color: var(--signal-foreground);
    background: var(--spark);
    box-shadow: none;
    --icon-tint-opacity: 0;
  }
  .is-current .node::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1.5px solid var(--spark);
    animation: path-pulse 1.8s var(--ease-out) infinite;
  }
  .is-goal .node {
    color: var(--gold-text);
    box-shadow: inset 0 0 0 1.5px var(--gold);
    --icon-tint: var(--gold);
    --icon-tint-opacity: 0.9;
  }
  @keyframes path-pulse {
    from {
      opacity: 0.7;
      transform: scale(0.9);
    }
    to {
      opacity: 0;
      transform: scale(1.35);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .is-current .node::after {
      animation: none;
      opacity: 0.4;
    }
  }
</style>
