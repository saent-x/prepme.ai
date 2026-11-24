<script lang="ts">
  import { Toggle, ToggleGroup } from '@ui-sdk/svelte/toggle';
  import { cn } from '$lib/utils';

  interface Option {
    value: string;
    label: string;
    title?: string;
    /** Optional image (e.g. a face) shown before the label. */
    image?: string;
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
      class="h-auto cursor-pointer inline-flex h-7 items-center gap-1.5 rounded-full border-border bg-card px-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground data-pressed:border-foreground data-pressed:bg-card data-pressed:text-foreground"
    >
      {#if o.image}<img src={o.image} alt="" class="-ml-1 size-5 rounded-full" />{/if}{o.label}
    </Toggle>
  {/each}
</ToggleGroup>
