<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { Button } from '../ui/button';
  import { ChevronsUpDownIcon } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import ResponsiveCommand from './responsive-command.svelte';
  import * as Command from '$lib/components/ui/command/index';

  type Props = {
    itemSnippet: Snippet<[value: string]>;
    options: Array<{
      id: string;
      value: string;
      name?: string;
    }>;
    onSelect: (value: string) => void;
    value: string;
    placeholder?: string;
    className?: string;
    search?: string;
    queryLoading: boolean;
  };

  let {
    options = $bindable(),
    onSelect,
    value = $bindable(),
    search = $bindable(),
    placeholder,
    className,
    itemSnippet,
    queryLoading = $bindable()
  }: Props = $props();

  let open = $state<boolean>(false);
  const selectedOption = $derived(options.find((option) => option.value === value));
</script>

<Button
  type="button"
  variant="outline"
  onclick={() => (open = true)}
  class={cn(
    'h-9 justify-between px-2 font-normal',
    !selectedOption && 'text-muted-foreground',
    className
  )}
>
  <div>
    {#if selectedOption?.name || selectedOption?.value}
      {@render itemSnippet(selectedOption.name ?? selectedOption.value)}
    {:else}
      {placeholder}
    {/if}
  </div>
  <ChevronsUpDownIcon />
</Button>

<ResponsiveCommand
  bind:open={
    () => open,
    (v) => {
      search = '';
      open = v;
    }
  }
  shouldFilter={!search}
>
  {#if search}
    <Command.Input placeholder="Search..." bind:value={search} />
  {:else}
    <Command.Input placeholder="Search..." />
  {/if}
  <Command.List class="List">
    {#if queryLoading}
      <p class="p-4 text-sm">searching...</p>
    {:else}
      {#each options as option (option.id)}
        <Command.Item
          onSelect={() => {
            onSelect(option.value);
            open = false;
          }}
          >{@render itemSnippet(option.name ?? option.value)}
        </Command.Item>
      {/each}
    {/if}
  </Command.List>
</ResponsiveCommand>
