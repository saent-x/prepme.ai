<script lang="ts">
  import { Call, CallingState, StreamVideoClient } from '@stream-io/video-client';
  import { getToken } from '../../../routes/dashboard/interviews/interviews.remote';
  import { env } from '$env/dynamic/public';
  import { LoaderIcon } from '@lucide/svelte';
  import CallUI from './call-ui.svelte';

  type Props = {
    interviewId: string;
    interviewName: string;
    userId: string;
    userName: string;
    userImage: string;
  };

  const { interviewId, interviewName, userId, userName, userImage }: Props = $props();
  const tokenQuery = getToken();

  let client = $state<StreamVideoClient>();
  $effect(() => {
    if (!tokenQuery.current) return;

    const _client = new StreamVideoClient({
      apiKey: env.PUBLIC_STREAM_API_KEY,
      user: {
        id: userId,
        name: userName,
        image: userImage
      },
      tokenProvider: getToken // probably not work????
    });

    client = _client;

    return () => {
      _client.disconnectUser();
      client = undefined;
    };
  });

  let call = $state<Call>();
  $effect(() => {
    if (!client) return;

    const _call = client.call('default', interviewId);
    _call.camera.disable();
    _call.microphone.disable();

    call = _call;

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave();
        _call.endCall();
        call = undefined;
      }
    };
  });
</script>

{#if !call && !client}
  <div class="from-sidebar-accent to-sidebar flex h-screen items-center justify-center bg-radial">
    <LoaderIcon class="size-6 animate-spin text-white" />
  </div>
{:else}
  <CallUI {interviewName} {client} bind:call={call!} />
{/if}
