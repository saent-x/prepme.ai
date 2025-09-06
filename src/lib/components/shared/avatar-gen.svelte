<script lang="ts" module>
  import { createAvatar } from '@dicebear/core';
  import { botttsNeutral, funEmoji, initials } from '@dicebear/collection';

  type Variant = 'botttsNeutral' | 'initials' | 'funEmoji';

  export const generateAvatarUri = (variant: Variant, seed: string, size?: number): string => {
    let avatar;

    if (variant === 'botttsNeutral') {
      avatar = createAvatar(botttsNeutral, { size, seed });
    } else if (variant === 'funEmoji') {
      avatar = createAvatar(funEmoji, { size, seed });
    } else {
      avatar = createAvatar(initials, { size, seed, fontWeight: 500, fontSize: 42 });
    }

    return avatar.toDataUri();
  };
</script>

<script lang="ts">
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
      avatar =
        variant === 'bot'
          ? generateAvatarUri('botttsNeutral', name || 'Bot', 128)
          : generateAvatarUri('funEmoji', name || 'User', 128);
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
