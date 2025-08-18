<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import { Button } from './ui/button';
  import { ChevronsUpDownIcon } from '@lucide/svelte';
  import { cn } from '$lib/utils';
  import ResponsiveCommand from './responsive-command.svelte';
  import * as Command from '$lib/components/ui/command/index';

  type Props = {
    itemSnippet: Snippet<[name: string]>;
    options: Array<{
      id: string;
      value: string;
      name: string;
    }>;
    onSelect: (value: string) => void;
    onSearch?: (value: string) => void;
    value: string;
    placeholder?: string;
    isSearchable?: boolean;
    className?: string;
    agentSearch: string;
    queryLoading: boolean;
  };

  let {
    options = $bindable(),
    onSelect,
    onSearch,
    value = $bindable(),
    agentSearch = $bindable(),
    placeholder,
    isSearchable,
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
    {#if selectedOption?.name}
      {@render itemSnippet(selectedOption.name)}
    {:else}
      {placeholder}
    {/if}
  </div>
  <ChevronsUpDownIcon />
</Button>

<ResponsiveCommand bind:open shouldFilter={false}>
  <Command.Input placeholder="Search..." bind:value={agentSearch} />
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
          >{@render itemSnippet(option.name)}
        </Command.Item>
      {/each}
    {/if}
  </Command.List>
</ResponsiveCommand>
