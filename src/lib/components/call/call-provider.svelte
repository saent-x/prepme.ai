<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { LoaderIcon } from '@lucide/svelte';
  import CallConnect from './call-connect.svelte';
  import { generateAvatarUri } from '../shared/avatar-gen.svelte';

  type Props = {
    interviewId: string;
    interviewName: string;
  };

  let { interviewId, interviewName }: Props = $props();
  const session = authClient.useSession();
</script>

{#if $session.isPending && !$session.data}
  <div class="from-sidebar-accent to-sidebar flex h-screen items-center justify-center bg-radial">
    <LoaderIcon class="size-6 animate-spin text-white" />
  </div>
{:else if $session.error}
  <div class="p-4 text-red-700">an error ocurred fetching session.</div>
{:else if $session.data}
  <CallConnect
    {interviewId}
    {interviewName}
    userId={$session.data.user.id}
    userName={$session.data.user.name}
    userImage={$session.data.user.image ?? generateAvatarUri('initials', $session.data.user.name)}
  />
{/if}
