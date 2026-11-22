<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { authClient } from '$lib/auth-client';
  import UserAvatar from '$lib/components/app/user-avatar.svelte';
  import { toggleMode, mode } from 'mode-watcher';
  import {
    House,
    Mic,
    Bot,
    CreditCard,
    Settings,
    LogOut,
    Moon,
    Sun,
    Menu,
    X
  } from '@lucide/svelte';

  let { data, children } = $props();
  let mobileOpen = $state(false);

  const nav = [
    { href: '/dashboard', label: 'Home', icon: House, exact: true },
    { href: '/dashboard/interviews', label: 'Interviews', icon: Mic },
    { href: '/dashboard/interviewers', label: 'Interviewers', icon: Bot },
    { href: '/dashboard/billing', label: 'Plan and billing', icon: CreditCard }
  ];
  const active = (href: string, exact = false) =>
    exact ? page.url.pathname === href : page.url.pathname === href || page.url.pathname.startsWith(href + '/');

  $effect(() => {
    page.url.pathname;
    mobileOpen = false;
  });

  async function signOut() {
    await authClient.signOut();
    await invalidateAll();
    goto('/');
  }

  const free = $derived(!data.usage.plan.premium);
  const used = $derived(Math.min(data.usage.usage.interviews, data.usage.limits.interviews));
</script>

{#snippet sidebar()}
  <div class="flex h-full flex-col gap-4 px-3 py-4">
    <a href="/dashboard" class="px-2.5 pt-0.5" aria-label="Home"><Logo /></a>
    <nav class="grid gap-0.5" aria-label="Main">
      {#each nav as item}
        <a
          href={item.href}
          aria-current={active(item.href, item.exact) ? 'page' : undefined}
          class="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
        >
          <item.icon class="size-4" strokeWidth={1.8} />
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="mt-auto grid gap-2.5 border-t pt-3">
      <a href="/dashboard/billing" class="flex justify-between px-2.5 text-[13px] text-muted-foreground hover:text-foreground">
        {#if free}
          <span>Free plan</span>
          <span class="tabular text-faint">{used} of {data.usage.limits.interviews} used</span>
        {:else}
          <span>Pro plan</span>
          <span class="text-faint">Unlimited</span>
        {/if}
      </a>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-muted">
          <UserAvatar name={data.user.name} image={data.user.image} class="size-[26px]" />
          <span class="min-w-0 flex-1 truncate text-sm font-semibold">{data.user.name}</span>
          <Settings class="size-[15px] text-faint" strokeWidth={1.8} />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-56">
          <DropdownMenu.Label class="truncate text-xs font-normal text-muted-foreground">{data.user.email}</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}<Sun /> Light mode{:else}<Moon /> Dark mode{/if}
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/dashboard/billing')}><CreditCard /> Plan and billing</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={signOut}><LogOut /> Sign out</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{/snippet}

<div class="min-h-svh lg:grid lg:grid-cols-[216px_1fr]">
  <aside class="sticky top-0 hidden h-svh border-r bg-card lg:block">
    {@render sidebar()}
  </aside>

  <!-- Mobile top bar -->
  <header class="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-card px-4 lg:hidden">
    <a href="/dashboard" aria-label="Home"><Logo /></a>
    <Button variant="ghost" size="icon" aria-label="Open menu" onclick={() => (mobileOpen = true)}><Menu /></Button>
  </header>
  {#if mobileOpen}
    <div class="fixed inset-0 z-50 lg:hidden">
      <button class="absolute inset-0 bg-black/40" aria-label="Close menu" onclick={() => (mobileOpen = false)}></button>
      <div class="absolute inset-y-0 left-0 w-[260px] border-r bg-card">
        <Button variant="ghost" size="icon" class="absolute top-2 right-2" aria-label="Close menu" onclick={() => (mobileOpen = false)}><X /></Button>
        {@render sidebar()}
      </div>
    </div>
  {/if}

  <main class="min-w-0">
    <div class="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-6">
      {@render children()}
    </div>
  </main>
</div>
