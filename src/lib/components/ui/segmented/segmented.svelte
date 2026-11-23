<script lang="ts" generics="T extends string | number">
  import { SegmentedControl, SegmentedControlItem } from '@ui-sdk/svelte/segmented-control';
  import { cn } from '$lib/utils';

  interface Option {
    value: T;
    label: string;
    disabled?: boolean;
    title?: string;
  }
  interface Props {
    value: T;
    options: Option[];
    'aria-label': string;
    name?: string;
    class?: string;
  }

  let { value = $bindable(), options, name, class: className, ...rest }: Props = $props();
</script>

<SegmentedControl
  {name}
  bind:value={() => String(value), (next) => {
    const option = options.find((o) => String(o.value) === next);
    if (option) value = option.value;
  }}
  class={cn('grid auto-cols-fr grid-flow-col gap-0 h-10 rounded-[8px] border-0 bg-muted p-1', className)}
  {...rest}
>
  {#each options as o (o.value)}
    <SegmentedControlItem
      value={String(o.value)}
      disabled={o.disabled}
      title={o.title}
      class="tabular h-auto cursor-pointer h-8 rounded-[6px] border border-transparent bg-transparent px-2 text-center text-sm font-medium text-muted-foreground transition-colors data-checked:border-border data-checked:bg-card data-checked:font-bold data-checked:text-foreground data-checked:shadow-sm data-disabled:cursor-not-allowed data-disabled:opacity-35"
    >
      {o.label}
    </SegmentedControlItem>
  {/each}
</SegmentedControl>
