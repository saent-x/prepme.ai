<script lang="ts">
  import '../app.css';
  import '@fontsource-variable/plus-jakarta-sans';
  import '@fontsource-variable/jetbrains-mono';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/toast';
  import { onNavigate } from '$app/navigation';

  const { children } = $props();

  // Cross-fade between pages where the browser supports view transitions.
  onNavigate((navigation) => {
    if (!document.startViewTransition || navigation.from?.url.pathname === navigation.to?.url.pathname) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<ModeWatcher defaultMode="light" />
<Toaster />
{@render children()}
