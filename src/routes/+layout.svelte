<script lang="ts">
  import '../app.css';
  import '@fontsource-variable/plus-jakarta-sans';
  import '@fontsource-variable/jetbrains-mono';
  import { ModeWatcher } from 'mode-watcher';
  import { Toaster } from '$lib/components/ui/toast';
  import { onNavigate } from '$app/navigation';
  import IconContext from 'phosphor-svelte/lib/IconContext';

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
<!-- Phosphor duotone everywhere: line work in the text colour, a soft fill layer that can take the accent. -->
<IconContext values={{ weight: 'duotone', size: 24 }}>
  <Toaster />
  {@render children()}
</IconContext>
