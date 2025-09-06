<script lang="ts">
  import { getChatToken } from '../../../routes/dashboard/interviews/interviews.remote';
  import { Channel as StreamChannel, StreamChat } from 'stream-chat';
  import LoadingState from '../states/loading-state.svelte';
  import { env } from '$env/dynamic/public';
  import ChatInterface from './chat-interface.svelte';

  type Props = {
    interviewId: string;
    interviewName: string;
    userId: string;
    userName: string;
    userImage: string;
  };

  const { interviewId, interviewName, userId, userName, userImage }: Props = $props();
  const tokenQuery = getChatToken();

  let channel = $state<StreamChannel>();
  let client = $state(StreamChat.getInstance(env.PUBLIC_STREAM_CHAT_API_KEY));

  $effect(() => {
    if (!tokenQuery.ready || !client) return;

    client.connectUser(
      {
        id: userId,
        name: userName,
        image: userImage
      },
      async () => {
        await tokenQuery.refresh();
        return tokenQuery.current;
      }
    );

    const _channel = client.channel("messaging", interviewId, {
      members: [userId]
    });

    channel = _channel;
  });
</script>

{#if !channel}
  <div class="from-sidebar-accent to-sidebar flex h-screen items-center justify-center bg-radial">
    <LoadingState title="Loading Chat" description="Chat is being loaded..." />
  </div>
{:else}
  <div class="overflow-hidden rounded-lg bg-white">
    <ChatInterface {client} {channel} />
  </div>
{/if}
