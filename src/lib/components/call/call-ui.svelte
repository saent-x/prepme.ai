<script lang="ts">
  import type { Call, StreamVideoClient } from '@stream-io/video-client';
  import CallLobby from './call-lobby.svelte';
  import CallActive from './call-active.svelte';
  import CallEnded from './call-ended.svelte';

  type Props = {
    interviewName: string;
    call: Call;
    client?: StreamVideoClient;
  };

  type ShowType = 'lobby' | 'call' | 'ended';

  const { interviewName, call = $bindable(), client }: Props = $props();
  let show = $state<ShowType>('lobby');

  const handleJoin = async () => {
    if (!call) return;

    await call.join();
    show = 'call';
  };

  const handleLeave = () => {
    if (!call) return;

    call.endCall();
    show = 'ended';
  };
</script>

<div class="h-full">
  {#if show === 'lobby'}
    <CallLobby {call} onJoin={handleJoin} />
  {:else if show === 'call'}
    <CallActive {interviewName} onLeave={handleLeave} {call} {client} />
  {:else if show === 'ended'}
    <CallEnded />
  {/if}
</div>
