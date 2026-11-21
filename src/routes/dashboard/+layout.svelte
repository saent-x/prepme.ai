<script lang="ts">
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { authClient } from '$lib/auth-client';
  import { initials } from '$lib/utils';
  import { toggleMode, mode } from 'mode-watcher';
  import {
    LayoutDashboard,
    Mic,
    Users,
    CreditCard,
    Plus,
    LogOut,
    Moon,
    Sun,
    Menu,
    X
  } from '@lucide/svelte';

  let { data, children } = $props();
  let mobileOpen = $state(false);

  const nav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/interviews', label: 'Interviews', icon: Mic },
    { href: '/dashboard/interviewers', label: 'Interviewers', icon: Users },
    { href: '/dashboard/billing', label: 'Plan & billing', icon: CreditCard }
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
  <div class="flex h-full flex-col gap-6 p-4">
    <a href="/dashboard" class="px-2 pt-1" aria-label="Dashboard"><Logo /></a>
    <Button href="/dashboard/interviews/new" variant="signal" class="w-full justify-start" size="lg">
      <Plus /> New interview
    </Button>
    <nav class="grid gap-1" aria-label="Main">
      {#each nav as item}
        <a
          href={item.href}
          aria-current={active(item.href, item.exact) ? 'page' : undefined}
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-xs"
        >
          <item.icon class="size-[18px]" />
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="mt-auto grid gap-3">
      {#if free}
        <a href="/dashboard/billing" class="block rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">Free plan</span>
            <span class="tabular font-mono text-xs text-muted-foreground">{used}/{data.usage.limits.interviews}</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-signal" style="width:{(used / data.usage.limits.interviews) * 100}%"></div>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">interviews used · Upgrade for unlimited</p>
        </a>
      {/if}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger class="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-accent">
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-foreground font-mono text-xs font-semibold text-background">
            {initials(data.user.name)}
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium">{data.user.name}</span>
            <span class="block truncate text-xs text-muted-foreground">{data.user.email}</span>
          </span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-56">
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}<Sun /> Light mode{:else}<Moon /> Dark mode{/if}
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={() => goto('/dashboard/billing')}><CreditCard /> Plan & billing</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={signOut}><LogOut /> Sign out</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{/snippet}

<div class="min-h-svh lg:grid lg:grid-cols-[260px_1fr]">
  <aside class="sticky top-0 hidden h-svh border-r bg-muted/40 lg:block">
    {@render sidebar()}
  </aside>

  <!-- Mobile top bar -->
  <header class="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
    <a href="/dashboard" aria-label="Dashboard"><Logo /></a>
    <Button variant="ghost" size="icon" aria-label="Open menu" onclick={() => (mobileOpen = true)}><Menu /></Button>
  </header>
  {#if mobileOpen}
    <div class="fixed inset-0 z-50 lg:hidden">
      <button class="absolute inset-0 bg-black/40" aria-label="Close menu" onclick={() => (mobileOpen = false)}></button>
      <div class="absolute inset-y-0 left-0 w-[280px] border-r bg-background">
        <Button variant="ghost" size="icon" class="absolute top-3 right-3" aria-label="Close menu" onclick={() => (mobileOpen = false)}><X /></Button>
        {@render sidebar()}
      </div>
    </div>
  {/if}

  <main class="min-w-0">
    <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      {@render children()}
    </div>
  </main>
</div>
