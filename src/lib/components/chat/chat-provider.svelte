<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { generateAvatarUri } from '../shared/avatar-gen.svelte';
  import LoadingState from '../states/loading-state.svelte';
  import ChatUi from './chat-ui.svelte';

  type Props = {
    interviewId: string;
    interviewName: string;
  };

  let { interviewId, interviewName }: Props = $props();
  const session = authClient.useSession();
</script>

{#if $session.isPending && !$session.data}
  <LoadingState title="Loading..." description="Please wait while chat is being loaded" />
{:else if $session.error}
  <div class="p-4 text-red-700">an error ocurred fetching session.</div>
{:else if $session.data}
  <ChatUi
    {interviewId}
    {interviewName}
    userId={$session.data.user.id}
    userName={$session.data.user.name}
    userImage={$session.data.user.image ?? generateAvatarUri('initials', $session.data.user.name)}
  />
{/if}
