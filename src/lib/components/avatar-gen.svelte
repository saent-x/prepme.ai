<script lang="ts">
  import { createAvatar } from '@dicebear/core';
  import { botttsNeutral, funEmoji } from '@dicebear/collection';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
    import { cn } from '$lib/utils';

  type Props = {
    class?: string,
    variant?: string;
    name: string;
  };

  let { class: className, variant, name = "" }: Props = $props();
  let avatar = $state('');

  if (variant === 'bot') {
    avatar = createAvatar(botttsNeutral, {
      size: 128
    }).toDataUri();
  } else {
    avatar = createAvatar(funEmoji, {
      size: 128
    }).toDataUri();
  }
</script>

<Avatar.Root class={cn(className)}>
  <Avatar.Image src={avatar} alt="avatar" />
  <Avatar.Fallback class="rounded-lg">
    {name.charAt(0).toUpperCase()}
  </Avatar.Fallback>
</Avatar.Root>
