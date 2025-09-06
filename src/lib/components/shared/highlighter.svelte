<script lang="ts">
  import highlightWords from 'highlight-words';

  type Props = {
    text: string;
    query: string;
    class?: string;
  };

  let { text, query = $bindable(), class: className }: Props = $props();

  let chunks = $derived(
    highlightWords({
      text,
      query,
      matchExactly: false,
      clipBy: undefined
    })
  );
</script>

<div class={className ?? ''}>
  <p>
    {#each chunks as chunk (chunk.key)}
      <span class:highlight={chunk.match}>{chunk.text}</span>
    {/each}
  </p>
</div>

<style>
  .highlight {
      background-color: rgb(254 240 138);
  }
</style>
