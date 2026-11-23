<script lang="ts">
  import { Toast, ToastClose, ToastDescription, ToastRegion, ToastTitle } from '@ui-sdk/svelte/toast';
</script>

<ToastRegion side="top" align="center">
  <Toast
    class="rounded-lg border bg-card text-sm text-foreground shadow-md data-[type=error]:border-destructive/40 data-[type=success]:border-success/40"
  >
    <ToastTitle class="font-semibold" />
    <ToastDescription class="text-muted-foreground" />
    <ToastClose aria-label="Dismiss" />
  </Toast>
</ToastRegion>
