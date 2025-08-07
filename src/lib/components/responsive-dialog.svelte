<script lang="ts">
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import type { Snippet } from 'svelte';
  import * as Drawer from '$lib/components/ui/drawer/index';
  import * as Dialog from '$lib/components/ui/dialog/index';

  type Props = {
    title: string;
    description: string;
    children: Snippet;
    open: boolean;
  };

  let isMobile = new IsMobile();

  let { title, description, children, open = $bindable() }: Props = $props();
</script>

{#if isMobile.current}
  <Drawer.Root bind:open>
    <Drawer.Content>
      <Drawer.Header>
        <Drawer.Title>{title}</Drawer.Title>
        <Drawer.Description>{description}</Drawer.Description>
      </Drawer.Header>
      {@render children()}
    </Drawer.Content>
  </Drawer.Root>
{:else}
  <Dialog.Root bind:open>
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>{description}</Dialog.Description>
      </Dialog.Header>
      {@render children()}
    </Dialog.Content>
  </Dialog.Root>
{/if}
