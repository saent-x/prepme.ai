<script lang="ts">
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import type { StreamChat, Channel as StreamChannel } from 'stream-chat';

  type Props = {
    client: StreamChat;
    channel?: StreamChannel;
    theme?: string;
  };

  let { client, channel, theme = 'str-chat__theme-light' }: Props = $props();

  let rootEl: HTMLElement;
  let root: ReturnType<typeof createRoot> | null = null;

  // React components loaded dynamically
  let Chat: any = null;
  let Channel: any = null;
  let Window: any = null;
  let MessageList: any = null;
  let MessageInput: any = null;
  let Thread: any = null;

  // Create the root once
  $effect(() => {
    if (typeof window === 'undefined') return;
    if (rootEl && !root) {
      root = createRoot(rootEl);
      renderReact();
    }
  });

  function renderReact() {
    if (!root) return;
    if (!Chat || !Channel || !Window || !MessageList || !MessageInput || !Thread)
      return;
    if (!client) return;

    const channelChildren = createElement(
      Channel,
      channel ? { channel } : undefined,
      createElement(
        Window,
        null,
        createElement(
          'div',
          { className: 'flex-1 overflow-y-auto max-h-[calc(100vh-23rem)] border-b' },
          createElement(MessageList, null)
        ),
        createElement(MessageInput, { focus: true })
      ),
      createElement(Thread, null)
    );

    root.render(createElement(Chat, { client, theme }, channelChildren));
  }

  // Load the components once
  $effect(() => {
    let cancelled = false;
    if (
      !Chat ||
      !Channel ||
      !Window ||
      !MessageList ||
      !MessageInput ||
      !Thread
    ) {
      import('stream-chat-react')
        .then((m) => {
          if (cancelled) return;
          Chat = m.Chat;
          Channel = m.Channel;
          Window = m.Window;
          MessageList = m.MessageList;
          MessageInput = m.MessageInput;
          Thread = m.Thread;
          renderReact();
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  });

  // Update React tree when props change
  $effect(() => {
    renderReact();
  });

  // Cleanup on destroy
  $effect(() => {
    return () => {
      root?.unmount();
      root = null;
    };
  });
</script>

<div bind:this={rootEl} class="sci-host"></div>

<style>
  .sci-host {
    width: 100%;
    height: 100%;
  }

  /* Ensure Stream Chat fills the container */
  :global(.str-chat) {
    height: 100%;
  }
</style>
