<script lang="ts">
  import * as Command from '$lib/components/ui/command/index';
  import ResponsiveCommand from '../shared/responsive-command.svelte';

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();
</script>

<ResponsiveCommand bind:open>
  <Command.Input placeholder="Find and interview or agent" />
  <Command.List class="List">
    <Command.Item>Test</Command.Item>
    <Command.Item>Test2</Command.Item>
    <Command.Item>Test3</Command.Item>
  </Command.List>
</ResponsiveCommand>
