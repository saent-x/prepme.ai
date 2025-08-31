<script lang="ts">
  import type { Snippet } from 'svelte';
  import InitialsFallback from './initials-fallback.svelte';

  type Participant = {
    name: string;
    userId: string;
    image: string;
  };
  type Props = {
    participant: Participant;
    children?: Snippet;
  };

  const { participant, children }: Props = $props();

  const name = participant.name || participant.userId;
  let error = $state<boolean>(false);
</script>

{#snippet RenderName(name: string)}
  {#if name}
    <InitialsFallback {name} />
  {:else}
    <div class="gap-[2px] text-center text-[60%]">
      {@render children?.()}
    </div>
  {/if}
{/snippet}

<div class="flex aspect-[4/3] h-full w-full items-center justify-center">
  {#if !participant.image || error}
    {@render RenderName(participant.name)}
  {:else}
    <img
      onerror={() => (error = true)}
      alt={name}
      class="h-[100px] w-[100px] object-cover"
      src={participant.image}
    />
  {/if}
</div>
