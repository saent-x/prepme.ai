<script lang="ts">
  import { IsMobile } from '$lib/hooks/is-mobile.svelte';
  import type { Snippet } from 'svelte';
  import * as Drawer from '$lib/components/ui/drawer/index';
  import * as Dialog from '$lib/components/ui/dialog/index';
  import { Button } from '$lib/components/ui/button';
  import * as Command from '$lib/components/ui/command/index';

  type Props = {
    title?: string;
    description?: string;
    children: Snippet;
    open: boolean;
  };

  let isMobile = new IsMobile();

  let { title, description, children, open = $bindable() }: Props = $props();
</script>

{#if isMobile.current}
  <Drawer.Root bind:open>
    <Drawer.Content class="overflow-hidden p-0">
      <Drawer.Header class="sr-only">
        <Drawer.Title>{title ?? ''}</Drawer.Title>
        <Drawer.Description>{description ?? ''}</Drawer.Description>
      </Drawer.Header>
      <Command.Root>
        {@render children()}
      </Command.Root>
    </Drawer.Content>
  </Drawer.Root>
{:else}
  <Command.Dialog bind:open>
    {@render children()}
  </Command.Dialog>
{/if}
