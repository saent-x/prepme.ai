<script lang="ts">
  import { createAvatar } from '@dicebear/core';
  import { botttsNeutral, funEmoji } from '@dicebear/collection';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { cn } from '$lib/utils';

  type Props = {
    class?: string;
    variant?: string;
    name: string;
  };

  let { class: className, variant, name = $bindable() }: Props = $props();
  let avatar = $state('');

  $effect(() => {
    try {
      if (variant === 'bot') {
        avatar = createAvatar(botttsNeutral, {
          size: 128,
          seed: name || 'User'
        }).toDataUri();
      } else {
        avatar = createAvatar(funEmoji, {
          size: 128,
          seed: name || 'User'
        }).toDataUri();
      }
    } catch (error) {
      console.error('Avatar generation failed:', error);
      avatar = '';
    }
  });
</script>

<Avatar.Root class={cn(className)}>
  <Avatar.Image src={avatar} alt="avatar" />
  <Avatar.Fallback class="rounded-lg">
    {name.charAt(0).toUpperCase()}
  </Avatar.Fallback>
</Avatar.Root>
