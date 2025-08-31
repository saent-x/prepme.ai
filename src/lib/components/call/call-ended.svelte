<script lang="ts">
  import { Button } from '../ui/button';
</script>

<div class="flex flex-1 h-full items-center justify-center px-8 py-4">
  <div
    class="bg-background flex flex-col items-center justify-center gap-y-6 rounded-lg p-10 shadow-sm"
  >
    <div class="gapy-2 flex flex-col text-center">
      <h6 class="text-lg font-medium">You have ended the call</h6>
      <p class="text-sm">Summary should appear in a few minutes</p>
    </div>
    <div>
      <Button href="/dashboard/interviews">Back to interviews</Button>
    </div>
  </div>
</div>
