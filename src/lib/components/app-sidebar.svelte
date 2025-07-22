<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import VideoIcon from '@lucide/svelte/icons/video';
  import StarIcon from '@lucide/svelte/icons/star';
  import BotIcon from '@lucide/svelte/icons/bot';
  import Separator from './ui/separator/separator.svelte';
  import UserButton from '$lib/components/dashboard-user-button.svelte';
  import type { ComponentProps } from 'svelte';
  import { cn } from '$lib/utils';
  import { page } from '$app/state';
  import * as Collapsible from '$lib/components/ui/collapsible/index';

  const firstGroup = [
    {
      title: 'Interviews',
      url: '/dashboard/interviews',
      icon: VideoIcon
    },
    {
      title: 'Agents',
      url: '/dashboard/agents',
      icon: BotIcon
    }
  ];

  const secondGroup = [
    {
      title: 'Upgrade',
      url: '/dashboard/upgrade',
      icon: StarIcon
    }
  ];

  let {
    ref = $bindable(null),
    collapsible = 'icon',
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
  <Sidebar.Header class="text-sidebar-accent-foreground">
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          size="lg"
          class={cn(
            'from-sidebar-accent via-sidebar/50 to-sidebar/50 border border-transparent from-5% via-30% hover:border-[#5D6B68]/10 hover:bg-linear-to-r/oklch'
          )}
        >
          {#snippet child({ props })}
            <a href="/dashboard" {...props}>
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <enhanced:img src="/static/logo.png" class="h-[36px] w-[36px]" alt="prepme.ai" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">PrepMe</span>
                <span class="truncate text-xs">Dashboard</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Separator class="text-[#5d6b6a] opacity-20" />
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Main</Sidebar.GroupLabel>
      <Sidebar.Menu>
        {#each firstGroup as item (item.title)}
          <Collapsible.Root open={page.url.pathname === item.url} class="group/collapsible">
            {#snippet child({ props })}
              <Sidebar.MenuItem {...props}>
                <Collapsible.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuButton
                      {...props}
                      class={cn(
                        'from-sidebar-accent via-sidebar/50 to-sidebar/50 h-10 border border-transparent from-5% via-30% hover:border-[#5D6B68]/10 hover:bg-linear-to-r/oklch',
                        page.url.pathname === item.url && 'border-[#5D6B68]/10 bg-linear-to-r/oklch'
                      )}
                      isActive={page.url.pathname === item.url}
                      tooltipContent={item.title}
                    >
                      {#snippet child({ props })}
                        <a href={item.url} {...props}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
              </Sidebar.MenuItem>
            {/snippet}
          </Collapsible.Root>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>

    <Sidebar.Group>
      <Sidebar.GroupLabel>Setup</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each secondGroup as item (item.title)}
            <Collapsible.Root open={page.url.pathname === item.url} class="group/collapsible">
              {#snippet child({ props })}
                <Sidebar.MenuItem {...props}>
                  <Collapsible.Trigger>
                    {#snippet child({ props })}
                      <Sidebar.MenuButton
                        {...props}
                        class={cn(
                          'from-sidebar-accent via-sidebar/50 to-sidebar/50 h-10 border border-transparent from-5% via-30% hover:border-[#5D6B68]/10 hover:bg-linear-to-r/oklch',
                          page.url.pathname === item.url &&
                            'border-[#5D6B68]/10 bg-linear-to-r/oklch'
                        )}
                        isActive={page.url.pathname === item.url}
                        tooltipContent={item.title}
                      >
                        {#snippet child({ props })}
                          <a href={item.url} {...props}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        {/snippet}
                      </Sidebar.MenuButton>
                    {/snippet}
                  </Collapsible.Trigger>
                </Sidebar.MenuItem>
              {/snippet}
            </Collapsible.Root>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer class="text-white">
    <UserButton />
  </Sidebar.Footer>
  <Sidebar.Rail />
</Sidebar.Root>
