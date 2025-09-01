<script lang="ts">
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import type { Call, StreamVideoClient } from '@stream-io/video-client';
  import type { SpeakerLayoutProps, CallControlsProps } from '@stream-io/video-react-sdk';

  type Props = {
    call: Call;
    client?: StreamVideoClient;
    onLeave?: () => void;
    speakerProps?: SpeakerLayoutProps;
    controlsProps?: CallControlsProps;
  };

  let { call, client, onLeave, speakerProps = {}, controlsProps = {} }: Props = $props();

  let rootEl: HTMLElement;
  let root: ReturnType<typeof createRoot> | null = null;

  // React components loaded dynamically
  let SpeakerLayout: any = null;
  let CallControls: any = null;
  let StreamVideo: any = null;
  let StreamCall: any = null;
  let StreamTheme: any = null;

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
    if (!SpeakerLayout || !CallControls || !StreamVideo || !StreamCall || !StreamTheme) return;
    const _client = client ?? (call as any).client ?? (call as any)._client;
    if (!_client || !call) return;

    root.render(
      createElement(
        StreamVideo,
        { client: _client },
        createElement(
          StreamCall,
          { call },
          createElement(
            StreamTheme,
            null,
            createElement(
              'div',
              { className: 'crp-root' },
              createElement(
                'div',
                { className: 'crp-stage' },
                createElement(SpeakerLayout, { ...speakerProps })
              ),
              createElement(
                'div',
                { className: 'crp-controls' },
                createElement(CallControls, {
                  ...controlsProps,
                  onLeave: () => {
                    try {
                      onLeave?.();
                    } catch {}
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
    if (!SpeakerLayout || !CallControls || !StreamVideo || !StreamCall || !StreamTheme) {
      import('@stream-io/video-react-sdk')
        .then((m) => {
          if (cancelled) return;
          SpeakerLayout = m.SpeakerLayout;
          CallControls = m.CallControls;
          StreamVideo = m.StreamVideo;
          StreamCall = m.StreamCall;
          StreamTheme = m.StreamTheme;
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

<div bind:this={rootEl} class="crp-host"></div>

<style>
  /* Responsive caps for participant tiles within our stage container.
       Use viewport-aware clamps and never exceed the parent size. */
  :global(.crp-stage .str-video__participant-view) {
    /* Base: phones and very small viewports */
    max-width: min(100%, clamp(280px, 90vw, 800px));
    max-height: min(100%, clamp(220px, 56vh, 600px));
  }

  @media (min-width: 640px) {
    :global(.crp-stage .str-video__participant-view) {
      max-width: min(100%, clamp(480px, 72vw, 1360px));
      max-height: min(100%, clamp(300px, 60vh, 860px));
    }
  }

  /* XL screens */
  @media (min-width: 1280px) {
    :global(.crp-stage .str-video__participant-view) {
      max-width: min(100%, clamp(640px, 75vw, 700px));
      max-height: min(100%, clamp(360px, 65vh, 920px));
    }
  }

  /* 2XL screens */
  @media (min-width: 1536px) {
    :global(.crp-stage .str-video__participant-view) {
      max-width: min(100%, clamp(960px, 70vw, 1280px));
      max-height: min(100%, clamp(500px, 72vh, 1080px));
    }
  }

  /* Ultra-wide desktops */
  @media (min-width: 1920px) {
    :global(.crp-stage .str-video__participant-view) {
      max-width: min(100%, clamp(1200px, 68vw, 1440px));
      max-height: min(100%, clamp(640px, 74vh, 1200px));
    }
  }

  .crp-host {
    display: flex;
    flex-direction: column;
    align-content: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }
  :global(.crp-controls) {
    margin-top: 15px;
  }

  /* Mobile: keep controls fixed and let stage fill remaining height */
  @media (max-width: 640px) {
    :global(.sl-root) {
      grid-template-rows: 1fr;
      padding-bottom: var(--controls-height);
    }
    :global(.crp-controls) {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: var(--controls-height);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: max(8px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
        max(12px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
      background: rgba(16, 18, 19, 0.85);
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 50;
    }
  }
</style>
