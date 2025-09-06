<script lang="ts">
  import {
    getAudioBrowserPermission,
    getVideoBrowserPermission,
    type Call
  } from '@stream-io/video-client';
  import { onMount } from 'svelte';
  import DisabledVideoPreview from '../video/disabled-video-preview.svelte';
  import { authClient } from '$lib/auth-client';
  import { LoaderIcon, LogInIcon, Mic, MicOff, Video, VideoOff } from '@lucide/svelte';
  import { generateAvatarUri } from '../shared/avatar-gen.svelte';
  import VideoPreview from '../video/video-preview.svelte';
  import { Button } from '../ui/button';

  type Props = {
    call: Call;
    onJoin: () => void;
  };

  const { call = $bindable(), onJoin }: Props = $props();

  let hasMicPermissions = $state<boolean>(false);
  let hasCameraPermissions = $state<boolean>(false);

  onMount(async () => {
    const micPermission = getAudioBrowserPermission();
    const cameraPermission = getVideoBrowserPermission();

    hasMicPermissions = (await micPermission.getState()) === 'granted';
    hasCameraPermissions = (await cameraPermission.getState()) === 'granted';
  });

  const session = authClient.useSession();

  const toggleMicPermission = async () => {
    const micPermission = getAudioBrowserPermission();
    await micPermission.prompt({ forcePrompt: true });

    let state = await micPermission.getState();
    hasMicPermissions = state === 'granted';
  };

  const toggleVideoPermission = async () => {
    const cameraPermission = getVideoBrowserPermission();
    await cameraPermission.prompt({ forcePrompt: true });

    let state = await cameraPermission.getState();
    hasCameraPermissions = state === 'granted';
  };
</script>

{#if $session.isPending && !$session.data}
  <div class="from-sidebar-accent to-sidebar flex h-screen items-center justify-center bg-radial">
    <LoaderIcon class="size-6 animate-spin text-white" />
  </div>
{:else if $session.error}
  <div class="p-4 text-red-700">an error ocurred fetching session.</div>
{:else if $session.data}
  <div
    class="from-sidebar-accent to-sidebar flex h-full flex-col items-center justify-center bg-radial"
  >
    <div class="flex flex-1 items-center justify-center px-8 py-4">
      <div
        class="bg-background flex flex-col items-center justify-center gap-y-6 rounded-lg p-10 shadow-sm"
      >
        <div class="gapy-2 flex flex-col text-center">
          <h6 class="text-lg font-medium">Ready to join?</h6>
          <p class="text-sm">set up your call before joining</p>
        </div>
        <VideoPreview>
          <DisabledVideoPreview
            participant={{
              name: $session.data.user.name,
              userId: $session.data.user.id,
              image:
                $session.data.user.image ?? generateAvatarUri('initials', $session.data.user.name)
            }}
          />
        </VideoPreview>

        <div class="flex gap-x-2">
          <Button
            onclick={toggleMicPermission}
            class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white"
          >
            {#if hasMicPermissions}
              <Mic class="h-5" />
            {:else}
              <MicOff class="h-5" />
            {/if}
          </Button>
          <Button
            onclick={toggleVideoPermission}
            class="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white"
          >
            {#if hasCameraPermissions}
              <Video class="h-5" />
            {:else}
              <VideoOff class="h-5" />
            {/if}
          </Button>
        </div>

        <div class="flex w-full justify-between gap-x-2">
          <Button variant="ghost" href="/dashboard/interviews">Cancel</Button>
          <Button onclick={onJoin}>
            <LogInIcon />
            Join Call
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
