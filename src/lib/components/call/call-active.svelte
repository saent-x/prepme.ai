<script lang="ts">
    import SpeakerLayout from "./speaker-layout.svelte";
  import type { Call, StreamVideoClient } from '@stream-io/video-client';

  type Props = {
    onLeave: () => void;
    interviewName: string;
    call: Call;
    client?: StreamVideoClient;
  };

  const { onLeave, interviewName, call, client }: Props = $props();
</script>

<div class="flex h-full flex-col justify-between p-4 text-white">
  <div class="flex items-center gap-4 rounded-full bg-[#101213] p-4">
    <a href="/dashboard" aria-label="dashboard" class="flex items-center justify-center p-1 bg-white/10 rounded-full">
      <enhanced:img src="/static/logo.png" class="h-[22px] w-[22px]" alt="prepme.ai" />
    </a>
    <h4 class="text-base">
      {interviewName}
    </h4>
  </div>
    <div class="flex-1 min-h-0 flex items-center justify-center">
      <div class="w-full max-w-5xl">
    <SpeakerLayout {call} {client} onLeave={onLeave} />
      </div>
    </div>
</div>
