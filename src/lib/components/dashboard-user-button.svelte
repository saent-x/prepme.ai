<script lang="ts">
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import LogoutIcon from '@lucide/svelte/icons/log-out';
  import NotificationIcon from '@lucide/svelte/icons/bell';
  import UserCircleIcon from '@lucide/svelte/icons/user-circle';
  import GenAvatar from '$lib/components/avatar-gen.svelte';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { goto } from '$app/navigation';
  import { authClient } from '$lib/auth-client';

  const session = authClient.useSession();
  const sidebar = Sidebar.useSidebar();
</script>

{#if !$session.isPending}
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Sidebar.MenuButton
              {...props}
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border-border/10 flex w-full items-center justify-between overflow-hidden rounded-md border bg-white/5 p-3 hover:bg-white/10"
            >
              {#if $session.data?.user.image}
                <Avatar.Root class="size-8 rounded-lg">
                  <Avatar.Image src={$session.data?.user.image} alt={$session.data?.user.name} />
                </Avatar.Root>
              {:else}
                <GenAvatar name={$session.data?.user.name ?? ''} />
              {/if}
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{$session.data?.user.name}</span>
                <span class="text-muted-foreground truncate text-xs">
                  {$session.data?.user.email}
                </span>
              </div>
              <ChevronsUpDownIcon class="ml-auto size-4" />
            </Sidebar.MenuButton>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          class="z-50 w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
          side={sidebar.isMobile ? 'bottom' : 'right'}
          align="end"
          sideOffset={4}
        >
          <DropdownMenu.Label class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar.Root class="size-8 rounded-lg">
                <Avatar.Image src={$session.data?.user.image} alt={$session.data?.user.name} />
                <Avatar.Fallback class="rounded-lg">
                  {$session.data?.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </Avatar.Fallback>
              </Avatar.Root>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{$session.data?.user.name}</span>
                <span class="text-muted-foreground truncate text-xs">
                  {$session.data?.user.email}
                </span>
              </div>
            </div>
          </DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Group>
            <DropdownMenu.Item>
              <UserCircleIcon />
              Account
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <CreditCardIcon />
              Billing
            </DropdownMenu.Item>
            <DropdownMenu.Item>
              <NotificationIcon />
              Notifications
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Item
            onclick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => goto('/auth/sign-in')
                }
              })}
          >
            <LogoutIcon />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Sidebar.MenuItem>
  </Sidebar.Menu>
{/if}
