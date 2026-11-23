<script lang="ts">
  import { Toggle, ToggleGroup } from '@ui-sdk/svelte/toggle';
  import { cn } from '$lib/utils';

  interface Option {
    value: string;
    label: string;
    title?: string;
  }
  interface Props {
    /** The pressed chips. With `multiple` off there is always exactly one. */
    value: string[];
    options: readonly Option[];
    multiple?: boolean;
    'aria-label': string;
    class?: string;
  }

  let { value = $bindable(), options, multiple = false, class: className, ...rest }: Props = $props();
</script>

<ToggleGroup bind:value {multiple} deselectable={false} class={cn('flex flex-wrap gap-1.5', className)} {...rest}>
  {#each options as o (o.value)}
    <Toggle
      value={o.value}
      title={o.title}
      class="h-auto cursor-pointer rounded-md border-border bg-card px-2.5 py-1 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground data-pressed:border-primary data-pressed:bg-signal-soft data-pressed:text-primary"
    >
      {o.label}
    </Toggle>
  {/each}
</ToggleGroup>
