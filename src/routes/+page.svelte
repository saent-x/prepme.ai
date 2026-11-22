<script lang="ts">
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import { faceColour } from '$lib/avatars';
  import {
    ArrowRight,
    BriefcaseBusiness,
    ChartNoAxesCombined,
    Check,
    MessageCircleQuestion,
    Mic,
    RefreshCw,
    Sparkles,
    Timer
  } from '@lucide/svelte';

  let { data } = $props();
  let job = $state('');

  // The job typed in the hero is carried into the "New interviewer" pop-up.
  const start = $derived.by(() => {
    const target = `/dashboard/interviewers?new=1${job.trim() ? `&job=${encodeURIComponent(job.trim())}` : ''}`;
    return data.signedIn ? target : `/auth/sign-up?redirect=${encodeURIComponent(target)}`;
  });

  const floaters = [
    { n: 'sam', say: 'Tell me about a busy shift.', cls: 'left-[4%] top-[18%] size-16 -rotate-6' },
    { n: 'rex', say: '', cls: 'left-[13%] top-[62%] size-11 rotate-6' },
    { n: 'juno', say: 'Why this school?', cls: 'right-[5%] top-[14%] size-14 rotate-6' },
    { n: 'pip', say: '', cls: 'right-[14%] top-[64%] size-12 -rotate-6' }
  ];

  const features = [
    { icon: BriefcaseBusiness, title: 'Built from the job advert', body: 'Paste the advert and the questions match the job.' },
    { icon: Sparkles, title: 'A better answer, every time', body: 'Each question comes back with a stronger version to say next time.' },
    { icon: MessageCircleQuestion, title: 'Ask the coach', body: 'Chat about your interview afterwards.' },
    { icon: ChartNoAxesCombined, title: 'Skills you can track', body: 'Five skills scored after every interview.' },
    { icon: RefreshCw, title: 'Never lose progress', body: 'If the line drops, it picks up where you left off.' },
    { icon: Timer, title: 'Fits in a break', body: 'Ten minutes is enough for a useful session.' }
  ];

  const faqs = [
    { q: 'Do I need to install anything?', a: 'No. It runs in your browser. You only need a microphone.' },
    { q: 'Is it a real voice conversation?', a: 'Yes. You speak, the interviewer answers out loud and asks follow-ups based on what you said.' },
    { q: 'How is it scored?', a: 'Your answers are scored on five skills against a real hiring bar. 70 is a solid pass.' },
    { q: 'Is my voice recorded?', a: 'No. Only the text of the interview and your feedback are saved, and you can delete them.' }
  ];
</script>

<svelte:head>
  <title>PrepMe: practise any job interview out loud</title>
</svelte:head>

<div class="min-h-screen overflow-x-clip bg-card">
  <!-- Nav -->
  <header class="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5">
    <a href="/" aria-label="PrepMe home"><Logo /></a>
    <nav class="flex items-center gap-1" aria-label="Main">
      <a href="#how" class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">How it works</a>
      <a href="#pricing" class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:block">Pricing</a>
      {#if data.signedIn}
        <Button href="/dashboard" size="sm" class="ml-2">Open PrepMe</Button>
      {:else}
        <Button href="/auth/sign-in" variant="ghost" size="sm">Sign in</Button>
        <Button href="/auth/sign-up" size="sm">Start free</Button>
      {/if}
    </nav>
  </header>

  <!-- Hero -->
  <section class="relative mx-auto max-w-[1120px] px-5 pt-14 pb-16 text-center sm:pt-20">
    {#each floaters as f}
      <div class="absolute hidden lg:block {f.cls}" aria-hidden="true">
        <InterviewerAvatar name={f.n} class="size-full shadow-sm" />
        {#if f.say}
          <span class="absolute top-full left-1/2 mt-2 -translate-x-1/2 rotate-0 rounded-lg border bg-card px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-xs">{f.say}</span>
        {/if}
      </div>
    {/each}
    <h1 class="text-[44px] leading-[1.02] font-extrabold tracking-[-0.045em] sm:text-[64px]">
      Name the interview.<br /><span class="text-primary">Nail it.</span>
    </h1>
    <p class="mx-auto mt-4 max-w-md text-[17px] text-muted-foreground">Make an interviewer for the job you want. Practise out loud. Get a scorecard.</p>
    <form class="mx-auto mt-7 flex max-w-[520px] items-center gap-2 rounded-xl border border-input bg-card p-1.5 shadow-xs focus-within:border-primary" action={start} onsubmit={(e) => { e.preventDefault(); location.href = start; }}>
      <input
        bind:value={job}
        aria-label="The job you are interviewing for"
        placeholder="e.g. Staff Nurse at St Thomas'"
        class="h-10 min-w-0 flex-1 bg-transparent px-2.5 text-[15px] outline-none placeholder:text-faint"
      />
      <Button type="submit" size="lg">Build my interviewer <ArrowRight /></Button>
    </form>
    <p class="mt-4 text-[13px] text-muted-foreground">
      Works for any job: Nurse · Teacher · Solicitor · Store manager · Chef · Engineer and more.
    </p>
  </section>

  <!-- How it works: three small product pictures -->
  <section id="how" class="bg-primary text-primary-foreground">
    <div class="mx-auto max-w-[1120px] px-5 py-14">
      <h2 class="text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em]">Three steps. Twenty minutes.</h2>
      <div class="mt-8 grid gap-4 md:grid-cols-3">
        <!-- 1 Make -->
        <div>
          <div class="h-[212px] overflow-hidden rounded-xl bg-card p-4 text-left text-foreground">
            <div class="flex items-center gap-3">
              <InterviewerAvatar name="pip" size="lg" />
              <div class="flex-1">
                <div class="text-xs font-medium text-faint">Name</div>
                <div class="mt-0.5 rounded-md border border-input px-2 py-1 text-sm font-semibold">Pip</div>
              </div>
            </div>
            <div class="mt-3 text-xs font-medium text-faint">Interviewing you for</div>
            <div class="mt-0.5 rounded-md border border-input px-2 py-1 text-sm">Staff Nurse, A&E</div>
            <div class="mt-3 grid grid-cols-3 rounded-lg bg-muted p-[3px] text-center text-xs font-semibold text-muted-foreground">
              <span class="py-1">Friendly</span><span class="rounded-md bg-card py-1 text-foreground shadow-xs">Realistic</span><span class="py-1">Tough</span>
            </div>
          </div>
          <div class="mt-3 text-sm font-bold">1. Make your interviewer</div>
          <div class="text-[13px] opacity-80">Name the job. Pick how tough.</div>
        </div>
        <!-- 2 Talk -->
        <div>
          <div class="grid h-[212px] place-items-center overflow-hidden rounded-xl p-4 text-center text-[#18161f]" style="background:{faceColour('pip')}">
            <div>
              <span class="relative mx-auto grid size-20 place-items-center">
                <span class="absolute -inset-4 rounded-full bg-white/20"></span>
                <InterviewerAvatar name="pip" class="relative size-20 ring-4 ring-white" />
              </span>
              <div class="mt-6 rounded-lg bg-white/85 px-3 py-1.5 text-[13px] font-medium">Tell me about a time you had to prioritise.</div>
            </div>
          </div>
          <div class="mt-3 text-sm font-bold">2. Talk it through</div>
          <div class="text-[13px] opacity-80">A real voice conversation, with follow-ups.</div>
        </div>
        <!-- 3 Score -->
        <div>
          <div class="h-[212px] overflow-hidden rounded-xl bg-card p-4 text-left text-foreground">
            <div class="flex items-center gap-3">
              <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--muted)" stroke-width="6" />
                <circle cx="26" cy="26" r="22" fill="none" stroke="var(--success)" stroke-width="6" stroke-linecap="round" stroke-dasharray="107.8 138.2" transform="rotate(-90 26 26)" />
                <text x="26" y="31.5" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">78</text>
              </svg>
              <div class="text-sm leading-snug font-bold">Calm and safe. One thing to fix.</div>
            </div>
            {#each [['Communication', 80, true], ['Answer structure', 60, false], ['Role fit', 80, true]] as [l, v, ok]}
              <div class="mt-2.5 flex items-center gap-2 text-xs">
                <span class="w-28 font-medium">{l}</span>
                <span class="h-[5px] flex-1 rounded-full bg-muted"><span class="block h-full rounded-full {ok ? 'bg-success' : 'bg-warning'}" style="width:{v}%"></span></span>
              </div>
            {/each}
            <div class="mt-3 border-l-[3px] border-warning pl-2.5 text-xs">
              <div class="font-semibold text-warning">The one fix</div>
              <div>Say who you escalate to.</div>
            </div>
          </div>
          <div class="mt-3 text-sm font-bold">3. Get your scorecard</div>
          <div class="text-[13px] opacity-80">A score, one fix and a better answer for each question.</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="mx-auto max-w-[1120px] px-5 py-16">
    <h2 class="text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em]">More than a mock interview.</h2>
    <div class="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each features as f}
        <div class="flex gap-3">
          <f.icon class="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.8} />
          <div>
            <h3 class="text-[15px] font-bold">{f.title}</h3>
            <p class="mt-0.5 text-sm text-muted-foreground">{f.body}</p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="border-t bg-background">
    <div class="mx-auto max-w-[760px] px-5 py-16">
      <h2 class="text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em]">Start free.</h2>
      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        <div class="flex flex-col rounded-xl border bg-card p-5">
          <h3 class="font-bold">Free</h3>
          <div class="mt-1 text-3xl font-extrabold tracking-tight">£0</div>
          <ul class="mt-4 flex-1 space-y-1.5 text-sm">
            {#each [`${data.limits.interviews} interviews`, `${data.limits.interviewers} interviewers`, `Up to ${data.limits.maxMinutes} minutes each`, 'Full scorecard and coach'] as b}
              <li class="flex gap-2"><Check class="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.4} />{b}</li>
            {/each}
          </ul>
          <Button href={data.signedIn ? '/dashboard' : '/auth/sign-up'} variant="outline" class="mt-5">Start free</Button>
        </div>
        <div class="flex flex-col rounded-xl border-2 border-primary bg-card p-5">
          <h3 class="font-bold">Pro</h3>
          <div class="mt-1 text-3xl font-extrabold tracking-tight">Unlimited</div>
          <ul class="mt-4 flex-1 space-y-1.5 text-sm">
            {#each ['Unlimited interviews', 'Unlimited interviewers', 'Up to 45 minutes each', 'Everything in Free'] as b}
              <li class="flex gap-2"><Check class="mt-0.5 size-4 shrink-0 text-success" strokeWidth={2.4} />{b}</li>
            {/each}
          </ul>
          <Button href={data.signedIn ? '/dashboard/billing' : '/auth/sign-up?redirect=/dashboard/billing'} class="mt-5">See Pro</Button>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="mx-auto max-w-[760px] px-5 py-16">
    <h2 class="text-center text-[30px] leading-tight font-extrabold tracking-[-0.03em]">Questions</h2>
    <div class="mt-6 divide-y border-y">
      {#each faqs as f}
        <details class="group py-3.5">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold">
            {f.q}<span class="text-xl leading-none font-normal text-faint transition-transform group-open:rotate-45">+</span>
          </summary>
          <p class="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
        </details>
      {/each}
    </div>
  </section>

  <!-- CTA -->
  <section class="bg-primary text-primary-foreground">
    <div class="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-4 px-5 py-10">
      <div class="flex -space-x-2">
        {#each ['sam', 'rex', 'juno', 'ivy'] as n}<InterviewerAvatar name={n} class="size-11 ring-2 ring-primary" />{/each}
      </div>
      <h2 class="flex-1 text-[26px] leading-tight font-extrabold tracking-[-0.03em]">They're ready when you are.</h2>
      <Button href={start} size="lg" class="bg-white text-[#18161f] hover:bg-white/90"><Mic /> Start free</Button>
    </div>
  </section>

  <footer class="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-muted-foreground">
    <Logo class="text-[17px]" />
    <span>© {new Date().getFullYear()} PrepMe</span>
  </footer>
</div>
