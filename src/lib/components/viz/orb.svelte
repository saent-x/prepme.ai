<script lang="ts">
  /** Audio-reactive orb for the interviewer. level is 0..1. */
  let {
    level = 0,
    speaking = false,
    state = 'live',
    size = 260
  }: { level?: number; speaking?: boolean; state?: 'idle' | 'connecting' | 'live' | 'reconnecting'; size?: number } = $props();

  const scale = $derived(1 + Math.min(level, 1) * 0.22);
</script>

<div class="relative grid place-items-center" style="width:{size}px;height:{size}px" aria-hidden="true">
  <!-- rings -->
  {#each [0, 1, 2] as i}
    <span
      class="absolute rounded-full border border-white/10 {speaking ? 'orb-ring' : ''}"
      style="inset:{i * -18}px;animation-delay:{i * 0.5}s"
    ></span>
  {/each}
  <span
    class="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
    style="background: radial-gradient(circle, color-mix(in oklch, var(--signal) 70%, transparent), transparent 70%); opacity:{speaking ? 0.75 : 0.25}"
  ></span>
  <span
    class="relative rounded-full transition-transform duration-75 {state === 'connecting' || state === 'reconnecting' ? 'animate-pulse' : ''}"
    style="width:{size * 0.62}px;height:{size * 0.62}px;transform:scale({scale});
      background:
        radial-gradient(circle at 32% 28%, oklch(0.9 0.08 50) 0%, transparent 38%),
        radial-gradient(circle at 70% 75%, oklch(0.45 0.2 25) 0%, transparent 55%),
        radial-gradient(circle, oklch(0.68 0.2 36), oklch(0.5 0.2 28));
      box-shadow: inset 0 -12px 40px oklch(0.3 0.12 25 / .6), 0 30px 80px -20px oklch(0.6 0.2 35 / .6);"
  ></span>
</div>

<style>
  .orb-ring {
    animation: ripple 2.4s ease-out infinite;
  }
  @keyframes ripple {
    0% {
      transform: scale(0.92);
      opacity: 0.9;
    }
    100% {
      transform: scale(1.18);
      opacity: 0;
    }
  }
</style>
