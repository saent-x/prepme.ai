<script lang="ts">
  import '../app.css';
  import '@fontsource-variable/plus-jakarta-sans';
  import '@fontsource-variable/jetbrains-mono';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/toast';

  const { children } = $props();
</script>

<ModeWatcher defaultMode="light" />
<Toaster />
{@render children()}
