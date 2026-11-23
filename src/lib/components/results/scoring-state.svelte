<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { onMount, untrack } from 'svelte';
  import { LoaderCircle, RotateCcw } from '@lucide/svelte';

  let { interviewId, error: initialError }: { interviewId: string; error: string | null } = $props();
  let error = $state<string | null>(untrack(() => initialError));
  let running = $state(false);

  async function run() {
    running = true;
    error = null;
    try {
      const res = await fetch(`/api/interviews/${interviewId}/analyse`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        error = body?.message ?? 'Scoring failed.';
      }
    } catch {
      error = 'Network error while scoring.';
    } finally {
      running = false;
      await invalidate('app:interview');
    }
  }

  // If the call ended without scoring finishing (closed tab, network), kick it off here.
  onMount(() => {
    if (!initialError) void run();
  });
</script>

<div class="grid place-items-center rounded-xl border bg-card px-6 py-12 text-center">
  {#if error && !running}
    <h2 class="font-bold">Scoring didn't finish</h2>
    <p class="mt-1 max-w-md text-sm text-muted-foreground">Your transcript is saved. {error}</p>
    <Button class="mt-4" onclick={run}><RotateCcw /> Try again</Button>
  {:else}
    <h2 class="flex items-center gap-2 font-bold"><LoaderCircle class="size-4 animate-spin text-primary" /> Scoring your interview</h2>
    <p class="mt-1 max-w-md text-sm text-muted-foreground">Usually 20 to 60 seconds.</p>
  {/if}
</div>
