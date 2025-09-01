<script lang="ts">
  import type { Call, StreamVideoClient } from '@stream-io/video-client';
  import SpeakerCallControls from './speaker-call-controls.svelte';

  type Props = {
    onLeave: () => void;
    interviewName: string;
    call: Call;
    client?: StreamVideoClient;
  };

  const { onLeave, interviewName, call, client }: Props = $props();
</script>

<div class="flex h-full flex-col p-4 text-white">
  <div class="flex items-center gap-4 rounded-full bg-[#101213] p-4">
    <a
      href="/dashboard"
      aria-label="dashboard"
      class="flex items-center justify-center rounded-full bg-white/10 p-1"
    >
      <enhanced:img src="/static/logo.png" class="h-[22px] w-[22px]" alt="prepme.ai" />
    </a>
    <h4 class="text-base">
      {interviewName}
    </h4>
  </div>
  <SpeakerCallControls {call} {client} {onLeave} />
</div>
