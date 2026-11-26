<script lang="ts">
  // Keeps one practised answer as a story, or says it is already kept.
  import { invalidate } from '$app/navigation';
  import { BookmarkSimple, Check } from '$lib/icons';
  import { toast } from '$lib/components/ui/toast';

  let {
    source,
    kept,
    refresh
  }: {
    /** "redo:<id>" or "answer:<id>". */
    source: string;
    kept: boolean;
    /** The page data to load again once it is kept. */
    refresh: string;
  } = $props();
  let busy = $state(false);

  async function keep() {
    busy = true;
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source })
      });
      if (!res.ok) toast.error((await res.json().catch(() => null))?.message ?? 'Could not keep that story.');
      else await invalidate(refresh);
    } catch {
      toast.error('Network error. Check your connection and try again.');
    } finally {
      busy = false;
    }
  }
</script>

{#if kept}
  <a href="/dashboard/stories" class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
    <Check class="size-3.5 text-success" /> Kept as a story
  </a>
{:else}
  <button type="button" class="link inline-flex items-center gap-1.5 text-xs" disabled={busy} onclick={keep}>
    <BookmarkSimple class="size-3.5" /> Keep as a story
  </button>
{/if}
