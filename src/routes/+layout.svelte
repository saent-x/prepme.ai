<script lang="ts">
  import '../app.css';
  import '@fontsource-variable/inter';

  import { Toaster } from '$lib/components/ui/sonner/index.js';
  import { NuqsAdapter } from 'nuqs-svelte/adapters/svelte-kit';

  const { children } = $props();
</script>

<NuqsAdapter>
  <Toaster />
  {@render children()}
</NuqsAdapter>
