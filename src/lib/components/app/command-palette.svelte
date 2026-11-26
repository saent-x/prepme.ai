<script lang="ts">
  import { goto } from '$app/navigation';
  import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandGroupLabel,
    CommandInput,
    CommandItem,
    CommandItemIcon,
    CommandItemText,
    CommandList,
    CommandShortcut
  } from '@ui-sdk/svelte/command';
  import { Dialog, DialogBackdrop, DialogContent, DialogTitle } from '@ui-sdk/svelte/dialog';
  import InterviewerAvatar from './interviewer-avatar.svelte';
  import ScoreChip from './score-chip.svelte';
  import StatusBadge from './status-badge.svelte';
  import { mode } from 'mode-watcher';
  import { Briefcase, CreditCard, House, List, LogOut, Moon, PanelLeft, Plus, Search, Sun, Users } from '$lib/icons';
  import type { InterviewStatus } from '$lib/db/schema';
  import { jobName } from '$lib/jobs';

  type Props = {
    open: boolean;
    interviews: { id: string; name: string; agent: string; status: InterviewStatus; score: number | null }[];
    agents: { id: string; name: string }[];
    jobs: { id: string; title: string; company: string }[];
    onNewInterview: () => void;
    onBilling: () => void;
    onToggleSidebar: () => void;
    onToggleTheme: () => void;
    onSignOut: () => void;
  };
  let {
    open = $bindable(false),
    interviews,
    agents,
    jobs,
    onNewInterview,
    onBilling,
    onToggleSidebar,
    onToggleTheme,
    onSignOut
  }: Props = $props();

  const actions = $derived([
    { value: 'new', label: 'New interview', icon: Plus, keywords: ['start', 'practise', 'practice'], run: onNewInterview },
    { value: 'job', label: 'Add a job', icon: Briefcase, keywords: ['advert', 'fit', 'target'], run: () => goto('/dashboard/jobs/new') },
    { value: 'billing', label: 'Plan & billing', icon: CreditCard, keywords: ['upgrade', 'pro', 'subscription'], run: onBilling },
    {
      value: 'theme',
      label: mode.current === 'dark' ? 'Light mode' : 'Dark mode',
      icon: mode.current === 'dark' ? Sun : Moon,
      keywords: ['theme', 'appearance'],
      run: onToggleTheme
    },
    { value: 'sidebar', label: 'Toggle sidebar', icon: PanelLeft, keywords: ['collapse', 'expand'], shortcut: 'mod+b', run: onToggleSidebar },
    { value: 'signout', label: 'Sign out', icon: LogOut, keywords: ['log out'], run: onSignOut }
  ]);
  const pages = [
    { value: 'go:home', label: 'Home', icon: House, href: '/dashboard' },
    { value: 'go:jobs', label: 'Jobs', icon: Briefcase, href: '/dashboard/jobs' },
    { value: 'go:interviews', label: 'Interviews', icon: List, href: '/dashboard/interviews' },
    { value: 'go:agents', label: 'Agents', icon: Users, href: '/dashboard/interviewers' }
  ];

  function onAction(value: string) {
    open = false;
    const action = actions.find((a) => a.value === value);
    if (action) return action.run();
    const page = pages.find((p) => p.value === value);
    if (page) return goto(page.href);
    if (value.startsWith('interview:')) return goto(`/dashboard/interviews/${value.slice(10)}`);
    if (value.startsWith('job:')) return goto(`/dashboard/jobs/${value.slice(4)}`);
    if (value.startsWith('agent:')) return goto(`/dashboard/interviewers/${value.slice(6)}`);
  }
</script>

<Dialog bind:open>
  <DialogBackdrop class="fixed inset-0 z-50 bg-[#111114]/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
  <DialogContent
    class="fixed inset-auto top-[12svh] left-1/2 z-50 m-0 block w-[calc(100%-2rem)] max-w-[600px] -translate-x-1/2 overflow-hidden rounded-[12px] border-0 bg-card p-0 text-foreground shadow-modal transition-[opacity,scale] duration-150 data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0 motion-reduce:transition-none"
  >
    <DialogTitle class="sr-only">Search PrepMe</DialogTitle>
    <Command {onAction} loop class="palette flex w-full max-w-none flex-col rounded-none border-0 bg-transparent shadow-none">
      <div class="flex h-14 items-center gap-3 border-b px-4">
        <Search class="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <CommandInput
          aria-label="Search interviews, jobs, agents and actions"
          placeholder="Search interviews, jobs, agents and actions"
          class="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <kbd class="hidden rounded-[6px] border px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground sm:inline">Esc</kbd>
      </div>
      <CommandEmpty class="hidden px-4 py-10 data-empty:block text-center text-sm text-muted-foreground">Nothing matches that.</CommandEmpty>
      <CommandList class="max-h-[min(440px,60svh)] overflow-y-auto p-2">
        {#if interviews.length}
          <CommandGroup>
            <CommandGroupLabel class="group-label">Interviews</CommandGroupLabel>
            {#each interviews as i (i.id)}
              <CommandItem value="interview:{i.id}" label={i.name} keywords={[i.agent]} class="item">
                <CommandItemIcon><InterviewerAvatar name={i.agent} class="size-6" /></CommandItemIcon>
                <span class="min-w-0 flex-1 truncate"><CommandItemText>{i.name}</CommandItemText></span>
                <span class="hidden truncate text-xs text-muted-foreground sm:inline">{i.agent}</span>
                {#if i.status === 'completed'}<ScoreChip score={i.score} />{:else}<StatusBadge status={i.status} />{/if}
              </CommandItem>
            {/each}
          </CommandGroup>
        {/if}
        {#if jobs.length}
          <CommandGroup>
            <CommandGroupLabel class="group-label">Jobs</CommandGroupLabel>
            {#each jobs as j (j.id)}
              <CommandItem value="job:{j.id}" label={jobName(j)} keywords={['job']} class="item">
                <CommandItemIcon><Briefcase class="size-5 text-muted-foreground" /></CommandItemIcon>
                <span class="min-w-0 flex-1 truncate"><CommandItemText>{jobName(j)}</CommandItemText></span>
              </CommandItem>
            {/each}
          </CommandGroup>
        {/if}
        {#if agents.length}
          <CommandGroup>
            <CommandGroupLabel class="group-label">Agents</CommandGroupLabel>
            {#each agents as a (a.id)}
              <CommandItem value="agent:{a.id}" label={a.name} keywords={['agent', 'interviewer']} class="item">
                <CommandItemIcon><InterviewerAvatar name={a.name} class="size-6" /></CommandItemIcon>
                <span class="min-w-0 flex-1 truncate"><CommandItemText>{a.name}</CommandItemText></span>
              </CommandItem>
            {/each}
          </CommandGroup>
        {/if}
        <CommandGroup>
          <CommandGroupLabel class="group-label">Go to</CommandGroupLabel>
          {#each pages as p (p.value)}
            <CommandItem value={p.value} label={p.label} class="item">
              <CommandItemIcon><p.icon class="size-5 text-muted-foreground" /></CommandItemIcon>
              <CommandItemText class="flex-1">{p.label}</CommandItemText>
            </CommandItem>
          {/each}
        </CommandGroup>
        <CommandGroup>
          <CommandGroupLabel class="group-label">Actions</CommandGroupLabel>
          {#each actions as a (a.value)}
            <CommandItem value={a.value} label={a.label} keywords={a.keywords} class="item">
              <CommandItemIcon><a.icon class="size-5 text-muted-foreground" /></CommandItemIcon>
              <CommandItemText class="flex-1">{a.label}</CommandItemText>
              {#if a.shortcut}
                <CommandShortcut shortcut={a.shortcut} class="text-xs font-semibold text-muted-foreground" />
              {/if}
            </CommandItem>
          {/each}
        </CommandGroup>
      </CommandList>
    </Command>
  </DialogContent>
</Dialog>

<style>
  :global(.palette .group-label) {
    padding: 10px 10px 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-muted-foreground);
  }
  :global(.palette .item) {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 10px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }
  :global(.palette .item[data-highlighted]) {
    background: var(--color-muted);
  }
  :global(.palette [data-slot='command-item-text'] mark) {
    background: none;
    color: inherit;
    font-weight: 800;
  }
</style>
