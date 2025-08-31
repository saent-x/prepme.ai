<script lang="ts">
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import { type CallControlsProps } from '@stream-io/video-react-sdk';

  let props: CallControlsProps = $props();
  let rootEl: HTMLElement;

  $effect(() => {
    const root = createRoot(rootEl);

    import('@stream-io/video-react-sdk').then(({ CallControls }) => {
      const callControls = createElement(CallControls, { ...props });
      root.render(callControls);
    });

    return () => root.unmount();
  });
</script>

<div bind:this={rootEl} class="root"></div>
