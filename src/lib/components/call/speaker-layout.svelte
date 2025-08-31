<script lang="ts">
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import type { SpeakerLayoutProps } from '@stream-io/video-react-sdk';
  import type { Call, StreamVideoClient } from '@stream-io/video-client';

  type Props = SpeakerLayoutProps & {
    call: Call;
    client?: StreamVideoClient;
    onLeave?: () => void;
  };

  let props: Props = $props();
  let rootEl: HTMLElement;
  let root: ReturnType<typeof createRoot> | null = null;

  // React components to be loaded dynamically
  let SpeakerLayout: any = null;
  let StreamVideo: any = null;
  let StreamCall: any = null;
  let StreamTheme: any = null;
  let CallControls: any = null;

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
    if (!SpeakerLayout || !StreamVideo || !StreamCall || !StreamTheme || !CallControls) return;
  const { call, client: clientProp, onLeave, ...layoutProps } = props;
    if (!call) return;
    // derive client from call; fallback to private field if necessary
    const client = clientProp ?? (call as any).client ?? (call as any)._client;
    if (!client) return;
    root.render(
      createElement(
        StreamVideo,
    { client },
        createElement(
          StreamCall,
          { call },
          createElement(
            StreamTheme,
            null,
            createElement(
              'div',
              { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
              createElement('div', { style: { flex: 1, minHeight: 0 } },
                createElement(SpeakerLayout, { ...layoutProps })
              ),
              // spacer so fixed controls do not overlap content on mobile
              createElement('div', { className: 'controls-spacer' }),
              // responsive controls bar (fixed on mobile)
              createElement('div', { className: 'controls-bar' },
                createElement(CallControls, {
                  onLeave: () => {
                    try { onLeave?.(); } catch {}
                  }
                })
              )
            )
          )
        )
      )
    );
  }

  // Load the components once
  $effect(() => {
    let cancelled = false;
    if (!SpeakerLayout || !StreamVideo || !StreamCall || !StreamTheme || !CallControls) {
      import('@stream-io/video-react-sdk')
        .then((m) => {
          if (cancelled) return;
          SpeakerLayout = m.SpeakerLayout;
          StreamVideo = m.StreamVideo;
          StreamCall = m.StreamCall;
          StreamTheme = m.StreamTheme;
          CallControls = m.CallControls;
          renderReact();
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  });

  // Update React tree when props change (no re-import)
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

<div bind:this={rootEl} class="root"></div>

<style>
  /* Reserve space so the fixed controls don’t overlap content on small screens */
  :global(.controls-spacer) { display: none; }
  @media (max-width: 640px) {
    :global(.controls-spacer) { display: block; height: 72px; }
  }

  /* Controls bar: inline by default, fixed on mobile with safe-area padding */
  :global(.controls-bar) { width: 100%; padding: 8px 0; }
  @media (max-width: 640px) {
    :global(.controls-bar) {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 50;
      padding: max(10px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      background: rgba(16, 18, 19, 0.85);
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
  }
</style>
