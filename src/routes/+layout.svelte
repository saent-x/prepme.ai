<script lang="ts">
    import "../app.css";
    import { Toaster } from "$lib/components/ui/sonner/index.js";

    const { children } = $props();
</script>

<Toaster />
{@render children()}
