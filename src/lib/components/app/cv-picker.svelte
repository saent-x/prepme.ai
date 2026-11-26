<script lang="ts" module>
  /** A CV chosen in a form: freshly read (`text`) or reused from earlier (`from`). */
  export type PickedCv = { name: string; text?: string; words?: number; from?: string };
</script>

<script lang="ts">
  // Pick a CV for a form. The file is read on upload and travels as text in hidden fields
  // (cvText, cvName), or by reference to where it was used before (cvFrom).
  import { FileText, LoaderCircle, Paperclip, X } from '$lib/icons';

  let {
    cv = $bindable(null),
    busy = $bindable(false),
    id,
    hint = 'PDF, Word or text.'
  }: { cv?: PickedCv | null; busy?: boolean; id: string; hint?: string } = $props();

  let error = $state<string | null>(null);
  let input = $state<HTMLInputElement>();

  async function upload(file: File | undefined) {
    if (!file) return;
    error = null;
    busy = true;
    try {
      const body = new FormData();
      body.set('file', file);
      const res = await fetch('/api/cv/parse', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? 'That file could not be read.');
      cv = { name: data.name, text: data.text, words: data.words };
    } catch (e) {
      error = e instanceof Error ? e.message : 'That file could not be read.';
    } finally {
      busy = false;
      if (input) input.value = '';
    }
  }
</script>

<input type="hidden" name="cvText" value={cv?.text ?? ''} />
<input type="hidden" name="cvName" value={cv?.text ? cv.name : ''} />
<input type="hidden" name="cvFrom" value={cv?.from ?? ''} />
<input bind:this={input} type="file" accept=".pdf,.docx,.txt,.md" class="sr-only" {id} onchange={(e) => upload(e.currentTarget.files?.[0])} />
{#if busy}
  <span class="inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 text-[13px] font-medium"><LoaderCircle class="size-4 animate-spin" /> Reading your CV</span>
{:else if cv}
  <span class="inline-flex h-7 w-fit max-w-full animate-pop items-center gap-1.5 rounded-full bg-muted pr-1 pl-2.5 text-[13px] font-medium">
    <FileText class="size-4 shrink-0 text-muted-foreground" />
    <span class="truncate">{cv.name}</span>
    <span class="shrink-0 text-muted-foreground">{cv.words ? `· ${cv.words.toLocaleString()} words` : '· last used'}</span>
    <button type="button" class="grid size-5 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground" aria-label="Remove CV" onclick={() => (cv = null)}>
      <X class="size-3.5" />
    </button>
  </span>
{:else}
  <label
    for={id}
    class="flex h-10 min-w-0 cursor-pointer items-center gap-2 rounded-[8px] border border-dashed px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
    ondragover={(e) => e.preventDefault()}
    ondrop={(e) => {
      e.preventDefault();
      upload(e.dataTransfer?.files?.[0]);
    }}
  >
    <Paperclip class="size-4 shrink-0" /><span class="shrink-0 font-semibold">Add your CV</span><span class="truncate text-xs">{hint}</span>
  </label>
{/if}
{#if error}<p class="text-xs text-destructive">{error}</p>{/if}
