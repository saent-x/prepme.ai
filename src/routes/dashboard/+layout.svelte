<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto, invalidateAll, replaceState } from '$app/navigation';
  import InterviewDialog from '$lib/components/app/interview-dialog.svelte';
  import BillingDialog from '$lib/components/app/billing-dialog.svelte';
  import CommandPalette from '$lib/components/app/command-palette.svelte';
  import { useShortcut, useShortcutHint } from '@ui-sdk/svelte/shortcuts';
  import { toast } from '$lib/components/ui/toast';
  import { newInterview, openNewInterview, type NewInterviewPreset } from '$lib/new-interview.svelte';
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Menu from '$lib/components/ui/menu';
  import { authClient } from '$lib/auth-client';
  import UserAvatar from '$lib/components/app/user-avatar.svelte';
  import { toggleMode, mode } from 'mode-watcher';
  import {
    Briefcase,
    House,
    List,
    Users,
    CreditCard,
    Ellipsis,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    LogOut,
    Moon,
    Sun,
    Menu as MenuIcon,
    X,
    SpeakerHigh,
    SpeakerSlash,
    Info
  } from '$lib/icons';
  import { sound } from '$lib/sound';

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

  // Sound on or off, remembered on this device. Only nine moments ever make a sound (see $lib/sound).
  let muted = $state(false);
  onMount(() => (muted = sound.muted));
  function toggleSound() {
    muted = !muted;
    sound.setMuted(muted);
    if (!muted) sound.play('success');
  }

  let paletteOpen = $state(false);
  // Below lg the sidebar is a slide-in menu, so the shortcut opens that instead.
  const sidebarKey = () => (matchMedia('(min-width: 1024px)').matches ? toggleSidebar() : (mobileOpen = !mobileOpen));
  useShortcut('mod+b', sidebarKey, { description: 'Toggle sidebar' });
  useShortcut('mod+k', () => (paletteOpen = !paletteOpen), { description: 'Search', allowInInput: true });
  const searchHint = useShortcutHint('mod+k');
  const sidebarHint = useShortcutHint('mod+b');

  const nav = [
    { href: '/dashboard', label: 'Home', icon: House, exact: true },
    { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/dashboard/interviews', label: 'Interviews', icon: List },
    { href: '/dashboard/interviewers', label: 'Agents', icon: Users }
  ];
  const active = (href: string, exact = false) =>
    exact ? page.url.pathname === href : page.url.pathname === href || page.url.pathname.startsWith(href + '/');

  $effect(() => {
    page.url.pathname;
    mobileOpen = false;
  });

  // "New interview" is a pop-up. Any link to /dashboard/interviews/new opens it in place.
  let dialogKey = $state(0);
  const presetFrom = (q: URLSearchParams): NewInterviewPreset => ({
    agent: q.get('interviewer'),
    focus: q.get('focus'),
    job: q.get('job'),
    round: q.get('round')
  });
  function open(preset: NewInterviewPreset) {
    dialogKey += 1;
    openNewInterview(preset);
  }
  function onLinkClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || a.target) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === '/dashboard/billing') {
      e.preventDefault();
      billingOpen = true;
      return;
    }
    if (u.pathname !== '/dashboard/interviews/new') return;
    e.preventDefault();
    open(presetFrom(u.searchParams));
  }
  // Arriving by URL (an old link, or straight after making an agent) lands on ?new=1.
  $effect(() => {
    const u = page.url;
    if (u.pathname === '/dashboard/interviews' && u.searchParams.get('new') === '1') {
      const preset = presetFrom(u.searchParams);
      setTimeout(() => {
        replaceState('/dashboard/interviews', {});
        open(preset);
      });
    }
  });

  // "Plan and billing" is a pop-up too. Old links and the checkout return land on ?billing=1.
  let billingOpen = $state(false);
  $effect(() => {
    const u = page.url;
    if (u.searchParams.get('billing') !== '1') return;
    const upgraded = u.searchParams.get('upgraded');
    setTimeout(() => {
      replaceState(u.pathname, {});
      billingOpen = true;
      if (upgraded) toast.success('Thanks for upgrading. Pro is active.');
    });
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
  <div class="flex h-full flex-col {mini ? 'items-center px-3' : 'px-4'}">
    <div class="flex h-14 shrink-0 items-center {mini ? 'justify-center' : 'justify-between pl-2'}">
      <a href="/dashboard" aria-label="Home"><Logo mark={mini} /></a>
      {#if !mini}
        <button
          type="button"
          class="hidden size-8 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:grid"
          aria-label="Collapse sidebar"
          aria-expanded="true"
          title="Collapse sidebar ({sidebarHint.text})"
          aria-keyshortcuts={sidebarHint.ariaKeyshortcuts}
          onclick={toggleSidebar}><PanelLeftClose class="size-5" /></button
        >
      {/if}
    </div>
    <button
      type="button"
      onclick={() => (paletteOpen = true)}
      aria-label={mini ? 'Search' : undefined}
      aria-keyshortcuts={searchHint.ariaKeyshortcuts}
      title={mini ? `Search (${searchHint.text})` : undefined}
      class="mb-3 flex h-8 items-center gap-2.5 rounded-[8px] border text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground {mini
        ? 'w-10 justify-center border-transparent'
        : 'w-full px-3'}"
    >
      <Search class="size-[18px]" />
      {#if !mini}<span class="flex-1 text-left">Search</span><kbd class="text-[11px] font-semibold">{searchHint.text}</kbd>{/if}
    </button>
    <nav class="grid gap-1 {mini ? '' : 'w-full'}" aria-label="Main">
      {#each nav as item}
        <a
          href={item.href}
          aria-label={mini ? item.label : undefined}
          aria-current={active(item.href, item.exact) ? 'page' : undefined}
          class="group/nav relative flex h-8 items-center gap-2.5 rounded-[8px] text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-bold aria-[current=page]:text-foreground {mini
            ? 'w-10 justify-center'
            : 'px-3'}"
        >
          <item.icon class="size-[18px]" />
          {#if !mini}{item.label}{:else}
            <span
              role="tooltip"
              class="pointer-events-none absolute top-1/2 left-[calc(100%+12px)] z-50 -translate-y-1/2 rounded-[6px] bg-foreground px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-background opacity-0 shadow-pop transition-opacity duration-150 group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100"
              >{item.label}</span
            >
          {/if}
        </a>
      {/each}
    </nav>

    <div class="mt-auto grid w-full gap-3 pb-4 {mini ? 'justify-items-center' : ''}">
      {#if mini}
        <button
          type="button"
          class="hidden size-10 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:grid"
          aria-label="Expand sidebar"
          aria-expanded="false"
          title="Expand sidebar ({sidebarHint.text})"
          aria-keyshortcuts={sidebarHint.ariaKeyshortcuts}
          onclick={toggleSidebar}><PanelLeftOpen class="size-5" /></button
        >
      {/if}
      <div class="border-t {mini ? '-mx-3 self-stretch' : '-mx-4'}"></div>
      <Menu.Root>
        <Menu.Trigger
          aria-label="Account menu"
          class="flex h-auto items-center justify-start gap-3 rounded-[8px] border-0 bg-transparent text-left font-normal hover:bg-muted {mini ? 'size-10 justify-center px-0' : 'w-full px-2 py-1.5'}"
        >
          <UserAvatar name={data.user.name} image={data.user.image} />
          {#if !mini}
            <span class="grid min-w-0 flex-1 leading-tight">
              <span class="truncate text-sm font-bold">{data.user.name.split(' ')[0]}</span>
              <span class="truncate text-xs text-muted-foreground">{free ? 'Free plan' : 'Pro plan'}</span>
            </span>
            <Ellipsis class="size-5 text-muted-foreground" />
          {/if}
        </Menu.Trigger>
        <Menu.Content align="start" class="w-56">
          <Menu.Label class="truncate text-xs font-normal text-muted-foreground">{data.user.email}</Menu.Label>
          <Menu.Separator />
          <Menu.Item onSelect={() => (billingOpen = true)}><CreditCard /> Plan &amp; billing</Menu.Item>
          {#if data.admin}
            <Menu.Item onSelect={() => goto('/dashboard/costs')}>
              <!-- Drawn here, not imported, so this line does not depend on which icon set the app uses. -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 20v-6M12 20V4M18 20v-10" /></svg>
              AI cost
            </Menu.Item>
          {/if}
          <Menu.Item onSelect={toggleMode}>
            {#if mode.current === 'dark'}<Sun /> Light mode{:else}<Moon /> Dark mode{/if}
          </Menu.Item>
          <Menu.Item onSelect={toggleSound}>
            {#if muted}<SpeakerHigh /> Turn sound on{:else}<SpeakerSlash /> Turn sound off{/if}
          </Menu.Item>
          <Menu.Item onSelect={() => goto('/credits')}><Info /> Credits</Menu.Item>
          <Menu.Separator />
          <Menu.Item onSelect={signOut}><LogOut /> Sign out</Menu.Item>
        </Menu.Content>
      </Menu.Root>
    </div>
  </div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div onclick={onLinkClick} class="min-h-svh transition-[grid-template-columns] duration-150 lg:grid {collapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[232px_1fr]'}">
  <aside class="sticky top-0 z-20 hidden h-svh border-r bg-card lg:block {collapsed ? 'overflow-visible' : 'overflow-hidden'}">
    {@render sidebar(collapsed)}
  </aside>

  <!-- Mobile top bar -->
  <header class="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-card px-4 lg:hidden">
    <a href="/dashboard" aria-label="Home"><Logo /></a>
    <Button variant="ghost" size="icon" aria-label="Open menu" onclick={() => (mobileOpen = true)}><MenuIcon /></Button>
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

  <main class="vt-main min-w-0">
    <div class="mx-auto w-full px-4 py-6 sm:px-8 lg:px-12 lg:py-8 {collapsed ? 'lg:max-w-[1376px]' : 'lg:max-w-[1136px]'}">
      {@render children()}
    </div>
  </main>
</div>

<BillingDialog bind:open={billingOpen} usage={data.usage} />

<CommandPalette
  bind:open={paletteOpen}
  interviews={data.search.interviews}
  agents={data.search.agents}
  jobs={data.newInterview.jobs}
  onNewInterview={() => open({})}
  onBilling={() => (billingOpen = true)}
  onToggleSidebar={sidebarKey}
  onToggleTheme={toggleMode}
  onSignOut={signOut}
/>

{#key dialogKey}
  <InterviewDialog
    bind:open={newInterview.open}
    agents={data.newInterview.agents}
    examples={data.newInterview.examples}
    minutes={data.newInterview.minutes}
    premium={data.usage.plan.premium}
    lastCv={data.newInterview.lastCv}
    jobs={data.newInterview.jobs}
    agent={newInterview.agent}
    focus={newInterview.focus}
    job={newInterview.job}
    round={newInterview.round}
  />
{/key}
