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

<div class="grid place-items-center rounded-3xl border bg-card px-6 py-20 text-center">
  {#if error && !running}
    <span class="grid size-14 place-items-center rounded-2xl bg-signal-soft text-signal"><RotateCcw /></span>
    <h2 class="mt-5 text-xl font-semibold">Scoring didn't finish</h2>
    <p class="mt-2 max-w-md text-muted-foreground">Your transcript is saved. {error}</p>
    <Button class="mt-6" onclick={run}>Try again</Button>
  {:else}
    <LoaderCircle class="size-10 animate-spin text-signal" />
    <h2 class="mt-5 text-xl font-semibold">Scoring your interview</h2>
    <p class="mt-2 max-w-md text-muted-foreground">Reading every answer against the role. This usually takes 20 to 60 seconds.</p>
  {/if}
</div>
