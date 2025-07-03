<script lang="ts">
  import * as Command from '$lib/components/ui/command/index.js';

  type Props = {
    open: boolean;
  };
  let { open = $bindable() }: Props = $props();
</script>

<Command.Dialog bind:open>
  <Command.Input placeholder="Find and interview or agent" />
  <Command.List class="List">
    <Command.Item>Test</Command.Item>
  </Command.List>
</Command.Dialog>
