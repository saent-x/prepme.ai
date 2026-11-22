<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto, invalidateAll, replaceState } from '$app/navigation';
  import InterviewDialog from '$lib/components/app/interview-dialog.svelte';
  import { newInterview, openNewInterview } from '$lib/new-interview.svelte';
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
    PanelLeft,
    LogOut,
    Moon,
    Sun,
    Menu,
    X
  } from '@lucide/svelte';

  let { data, children } = $props();
  let mobileOpen = $state(false);

  // Collapsed sidebar shows icons only. The choice is remembered on this device.
  let collapsed = $state(false);
  onMount(() => {
    try {
      collapsed = localStorage.getItem('prepme:sidebar') === 'collapsed';
    } catch {
      /* storage blocked: stay expanded */
    }
  });
  function toggleSidebar() {
    collapsed = !collapsed;
    try {
      localStorage.setItem('prepme:sidebar', collapsed ? 'collapsed' : 'open');
    } catch {
      /* ignore */
    }
  }

  const nav = [
    { href: '/dashboard', label: 'Home', icon: House, exact: true },
    { href: '/dashboard/interviews', label: 'Interviews', icon: Mic },
    { href: '/dashboard/interviewers', label: 'Agents', icon: Bot }
  ];
  const active = (href: string, exact = false) =>
    exact ? page.url.pathname === href : page.url.pathname === href || page.url.pathname.startsWith(href + '/');

  $effect(() => {
    page.url.pathname;
    mobileOpen = false;
  });

  // "New interview" is a pop-up. Any link to /dashboard/interviews/new opens it in place.
  let dialogKey = $state(0);
  function open(preset: { agent?: string | null; focus?: string | null }) {
    dialogKey += 1;
    openNewInterview(preset);
  }
  function onLinkClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname !== '/dashboard/interviews/new') return;
    e.preventDefault();
    open({ agent: u.searchParams.get('interviewer'), focus: u.searchParams.get('focus') });
  }
  // Arriving by URL (an old link, or straight after making an agent) lands on ?new=1.
  $effect(() => {
    const u = page.url;
    if (u.pathname === '/dashboard/interviews' && u.searchParams.get('new') === '1') {
      const preset = { agent: u.searchParams.get('interviewer'), focus: u.searchParams.get('focus') };
      setTimeout(() => {
        replaceState('/dashboard/interviews', {});
        open(preset);
      });
    }
  });

  async function signOut() {
    await authClient.signOut();
    await invalidateAll();
    goto('/');
  }

  const free = $derived(!data.usage.plan.premium);
  const used = $derived(Math.min(data.usage.usage.interviews, data.usage.limits.interviews));
</script>

{#snippet sidebar(mini: boolean)}
  <div class="flex h-full flex-col gap-4 py-4 {mini ? 'items-center px-2' : 'px-3'}">
    <div class="flex h-7 items-center {mini ? '' : 'justify-between px-2.5'}">
      {#if !mini}<a href="/dashboard" aria-label="Home"><Logo /></a>{/if}
      <button
        type="button"
        class="hidden size-7 place-items-center rounded-md text-faint transition-colors hover:bg-muted hover:text-foreground lg:grid"
        aria-label={mini ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!mini}
        title={mini ? 'Expand sidebar' : 'Collapse sidebar'}
        onclick={toggleSidebar}><PanelLeft class="size-4" strokeWidth={1.8} /></button
      >
    </div>
    <nav class="grid gap-0.5 {mini ? '' : 'w-full'}" aria-label="Main">
      {#each nav as item}
        <a
          href={item.href}
          title={mini ? item.label : undefined}
          aria-label={mini ? item.label : undefined}
          aria-current={active(item.href, item.exact) ? 'page' : undefined}
          class="flex items-center gap-2.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-semibold aria-[current=page]:text-foreground {mini
            ? 'size-9 justify-center'
            : 'px-2.5 py-[7px]'}"
        >
          <item.icon class="size-4" strokeWidth={1.8} />
          {#if !mini}{item.label}{/if}
        </a>
      {/each}
    </nav>

    <div class="mt-auto grid gap-2.5 border-t pt-3 {mini ? 'justify-items-center' : 'w-full'}">
      {#if !mini}
        <a href="/dashboard/billing" class="flex justify-between px-2.5 text-[13px] text-muted-foreground hover:text-foreground">
          {#if free}
            <span>Free plan</span>
            <span class="tabular text-faint">{used} of {data.usage.limits.interviews} used</span>
          {:else}
            <span>Pro plan</span>
            <span class="text-faint">Unlimited</span>
          {/if}
        </a>
      {/if}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Account menu"
          class="flex items-center gap-2.5 rounded-lg text-left hover:bg-muted {mini ? 'size-9 justify-center' : 'w-full px-2.5 py-1.5'}"
        >
          <UserAvatar name={data.user.name} image={data.user.image} class="size-[26px]" />
          {#if !mini}
            <span class="min-w-0 flex-1 truncate text-sm font-semibold">{data.user.name}</span>
            <Settings class="size-[15px] text-faint" strokeWidth={1.8} />
          {/if}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start" class="w-56">
          <DropdownMenu.Label class="truncate text-xs font-normal text-muted-foreground">{data.user.email}</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={() => goto('/dashboard/billing')}><CreditCard /> Plan and billing</DropdownMenu.Item>
          <DropdownMenu.Item onclick={toggleMode}>
            {#if mode.current === 'dark'}<Sun /> Light mode{:else}<Moon /> Dark mode{/if}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={signOut}><LogOut /> Sign out</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div onclick={onLinkClick} class="min-h-svh transition-[grid-template-columns] duration-150 lg:grid {collapsed ? 'lg:grid-cols-[56px_1fr]' : 'lg:grid-cols-[216px_1fr]'}">
  <aside class="sticky top-0 hidden h-svh overflow-hidden border-r bg-card lg:block">
    {@render sidebar(collapsed)}
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
        {@render sidebar(false)}
      </div>
    </div>
  {/if}

  <main class="min-w-0">
    <div class="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-6">
      {@render children()}
    </div>
  </main>
</div>

{#key dialogKey}
  <InterviewDialog
    bind:open={newInterview.open}
    agents={data.newInterview.agents}
    examples={data.newInterview.examples}
    maxMinutes={data.newInterview.maxMinutes}
    agent={newInterview.agent}
    focus={newInterview.focus}
  />
{/key}
