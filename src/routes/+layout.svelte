<script lang="ts">
  import '../app.css';
  import '@fontsource-variable/inter-tight';
  import '@fontsource-variable/jetbrains-mono';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/sonner/index.js';

  const { children } = $props();
</script>

<ModeWatcher defaultMode="light" />
<Toaster position="top-center" richColors />
{@render children()}
