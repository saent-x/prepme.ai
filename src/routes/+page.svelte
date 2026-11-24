<script lang="ts">
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import InterviewerAvatar from '$lib/components/app/interviewer-avatar.svelte';
  import ScoreRing from '$lib/components/viz/score-ring.svelte';
  import { faceColour } from '$lib/avatars';
  import { reveal } from '$lib/actions/reveal';
  import { Building2, Check, ChevronDown, MapPin, Mic, Target, User } from '@lucide/svelte';

  let { data } = $props();

  const startHref = $derived(data.signedIn ? '/dashboard/interviews/new' : `/auth/sign-up?redirect=${encodeURIComponent('/dashboard/interviews/new')}`);

  const hero = [
    { name: 'Maya', role: 'Staff Engineer' },
    { name: 'Ravi', role: 'ML Manager' },
    { name: 'June', role: 'Product Lead' },
    { name: 'Omar', role: 'Head of Data' }
  ];
  const agents = [
    { name: 'Maya', blurb: 'Staff Engineer · tough on trade-offs' },
    { name: 'Ravi', blurb: 'ML hiring manager · warm, curious' },
    { name: 'June', blurb: 'Product lead · big on impact' },
    { name: 'Omar', blurb: 'Head of Data · numbers first' }
  ];
  const anyJob = [
    { name: 'Maya', tag: 'Engineering' },
    { name: 'Ravi', tag: 'Sales' },
    { name: 'June', tag: 'Marketing' },
    { name: 'Omar', tag: 'Finance' },
    { name: 'Lea', tag: 'Nursing' }
  ];
  const skills: [string, number][] = [
    ['Communication', 84],
    ['Technical depth', 80],
    ['Problem solving', 76],
    ['Answer structure', 62],
    ['Role fit', 82]
  ];
  const bar = (v: number) => (v >= 75 ? 'bg-success' : v >= 60 ? 'bg-warning' : 'bg-destructive');
  const maya = faceColour('Maya');
  const wave = [0.35, 0.6, 0.9, 0.5, 1, 0.7, 0.45, 0.85, 0.55, 0.3, 0.65, 0.4];
</script>

<svelte:head>
  <title>PrepMe: practise with an AI interviewer for the exact job</title>
</svelte:head>

{#snippet face(name: string, cls = 'size-7')}<InterviewerAvatar {name} class={cls} />{/snippet}

<div class="min-h-screen overflow-x-clip bg-background">
  <header class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 xl:px-0">
    <a href="/" aria-label="PrepMe home"><Logo /></a>
    <nav class="flex items-center gap-2" aria-label="Main">
      {#if data.signedIn}
        <Button href="/dashboard">Open PrepMe</Button>
      {:else}
        <a href="/auth/sign-in" class="px-3 text-sm font-semibold text-muted-foreground hover:text-foreground">Log in</a>
        <Button href="/auth/sign-up" variant="outline">Start free</Button>
      {/if}
    </nav>
  </header>

  <!-- Hero -->
  <section class="mx-auto max-w-[800px] px-5 pt-16 pb-20 text-center sm:pt-24">
    <h1 class="animate-rise text-[40px] leading-[1.15] font-extrabold tracking-[-0.03em] text-balance sm:text-[56px]">
      Practise with an AI interviewer for the exact job.
    </h1>
    <p class="mt-4 animate-rise text-base text-muted-foreground [animation-delay:80ms]">Talk it through by voice. Get a score and what to fix.</p>
    <div class="mt-10 grid grid-cols-4 justify-center gap-2 sm:flex sm:gap-10">
      {#each hero as h, i (h.name)}
        <div class="animate-pop" style="animation-delay:{160 + i * 90}ms">
          <InterviewerAvatar name={h.name} class="mx-auto size-14 transition-transform duration-300 hover:-rotate-6 sm:size-24" />
          <div class="mt-2 text-sm font-bold">{h.name}</div>
          <div class="text-xs text-muted-foreground">{h.role}</div>
        </div>
      {/each}
    </div>
    <Button href={startHref} class="mt-10 h-10 animate-rise px-6 [animation-delay:520ms]"><Mic /> Start free interview</Button>
  </section>

  <!-- Four ways it works, each with a real piece of the app -->
  <div class="mx-auto grid max-w-[1200px] gap-20 px-5 pb-20 xl:px-0">
    <!-- 1. Pick -->
    <section class="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[1fr_680px] lg:gap-20" use:reveal>
      <div>
        <h2 class="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-4xl">Pick your interviewer</h2>
        <p class="mt-3 text-base text-muted-foreground">Tough, friendly or neutral. Each one asks like a real panel.</p>
      </div>
      <div class="grid sm:min-h-[400px] grid-cols-[minmax(0,1fr)] place-items-center rounded-2xl bg-muted p-6 sm:p-10" aria-hidden="true">
        <div class="w-full max-w-[440px]">
          <div class="text-xs font-bold">Interviewer</div>
          <div class="mt-2 flex h-12 items-center gap-3 rounded-[8px] border-[1.5px] border-foreground bg-card px-3">
            {@render face('Maya')}
            <span class="text-sm font-bold">Maya</span>
            <span class="min-w-0 flex-1 truncate text-sm text-muted-foreground">Staff Engineer · tough on trade-offs</span>
            <ChevronDown class="size-4 rotate-180 text-muted-foreground" strokeWidth={1.6} />
          </div>
          <div class="mt-2 rounded-[10px] border bg-card p-1 shadow-pop">
            {#each agents as a, i (a.name)}
              <div class="flex h-12 items-center gap-3 rounded-[6px] px-2.5 text-sm {i === 0 ? 'bg-muted' : ''}">
                {@render face(a.name)}
                <span class="font-bold">{a.name}</span>
                <span class="min-w-0 flex-1 truncate text-muted-foreground">{a.blurb}</span>
                {#if i === 0}<Check class="size-4" strokeWidth={2} />{/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Paste -->
    <section class="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[680px_1fr] lg:gap-20" use:reveal>
      <div class="lg:order-2">
        <h2 class="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-4xl">Paste the job, get a tailored interview</h2>
        <p class="mt-3 text-base text-muted-foreground">PrepMe reads the role, the company and the skills.</p>
      </div>
      <div class="grid sm:min-h-[400px] grid-cols-[minmax(0,1fr)] place-items-center rounded-2xl bg-muted p-6 sm:p-10 lg:order-1" aria-hidden="true">
        <div class="w-full max-w-[480px] rounded-[10px] bg-card p-6 shadow-md">
          <div class="text-xs font-bold">Job description</div>
          <div class="mt-2 rounded-[8px] border px-3 py-2.5 text-sm leading-normal text-muted-foreground">
            <p class="line-clamp-3">We're hiring a Senior AI Engineer to own retrieval and evals for our contract review product. You'll ship LLM features end to end with Python and TypeScript…</p>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            {#each [{ icon: User, t: 'Senior AI Engineer' }, { icon: Building2, t: 'Juro' }, { icon: MapPin, t: 'London' }] as c (c.t)}
              <span class="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-[13px] font-medium"><c.icon class="size-4 text-muted-foreground" strokeWidth={1.6} />{c.t}</span>
            {/each}
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            {#each ['RAG', 'Evals', 'Python', 'TypeScript', 'LLM APIs'] as s (s)}
              <span class="inline-flex h-7 items-center rounded-full border px-2.5 text-[13px] font-medium">{s}</span>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Talk -->
    <section class="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[1fr_680px] lg:gap-20" use:reveal>
      <div>
        <h2 class="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-4xl">Talk it through, live</h2>
        <p class="mt-3 text-base text-muted-foreground">Speak naturally. The transcript keeps up.</p>
      </div>
      <div class="grid sm:min-h-[400px] grid-cols-[minmax(0,1fr)] items-center gap-8 rounded-2xl bg-muted p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-10" aria-hidden="true">
        <div class="flex flex-col items-center">
          <div class="relative grid size-[232px] place-items-center">
            <span class="absolute inset-0 animate-halo rounded-full border-[1.5px]" style="border-color:{maya}26"></span>
            <span class="absolute inset-4 rounded-full border-2" style="border-color:{maya}59"></span>
            <span class="absolute inset-7 rounded-full border-[3px]" style="border-color:{maya}"></span>
            <InterviewerAvatar name="Maya" class="relative size-40" />
          </div>
          <div class="mt-3 text-base font-extrabold">Maya</div>
          <div class="mt-2 flex h-5 items-center gap-1">
            {#each wave as w, n (n)}
              <span class="landing-wave w-1 rounded-[2px]" style="background:{maya};height:{Math.round(4 + w * 16)}px;animation-delay:{n * 90}ms"></span>
            {/each}
          </div>
        </div>
        <ol class="grid gap-4 rounded-[10px] bg-card p-5 shadow-md">
          {#each [{ who: 'Maya', you: false, t: 'Walk me through how you evaluated the retriever.' }, { who: 'You', you: true, t: 'I built a set of 200 real questions and tracked recall at five.' }, { who: 'Maya', you: false, t: 'What made you trust that set?' }] as l, n (n)}
            <li>
              <div class="flex items-center gap-2 text-xs font-bold">
                {#if l.you}<span class="grid size-6 place-items-center rounded-full bg-track text-[11px]">Y</span>{:else}{@render face('Maya', 'size-6')}{/if}
                {l.who}
              </div>
              <p class="mt-1 text-sm leading-normal {n === 2 ? 'text-muted-foreground italic' : ''}">{l.t}</p>
            </li>
          {/each}
        </ol>
      </div>
    </section>

    <!-- 4. Fix -->
    <section class="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[680px_1fr] lg:gap-20" use:reveal>
      <div class="lg:order-2">
        <h2 class="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-4xl">See exactly what to fix</h2>
        <p class="mt-3 text-base text-muted-foreground">A score per skill, and the moments that cost you.</p>
      </div>
      <div class="grid sm:min-h-[400px] grid-cols-[minmax(0,1fr)] place-items-center rounded-2xl bg-muted p-6 sm:p-10 lg:order-1" aria-hidden="true">
        <div class="grid w-full max-w-[560px] grid-cols-[minmax(0,1fr)] gap-6 rounded-[10px] bg-card p-5 shadow-md sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6 sm:gap-8">
          <ScoreRing score={78} size={128} label="/ 100" class="justify-self-center" />
          <div class="grid gap-3">
            {#each skills as [l, v] (l)}
              <div class="grid grid-cols-[112px_minmax(0,1fr)_24px] items-center gap-3 text-[13px]">
                <span class="font-semibold">{l}</span>
                <span class="h-1.5 overflow-hidden rounded-[3px] bg-track"><span class="grow-x block h-full rounded-[3px] {bar(v)}" style="width:{v}%"></span></span>
                <span class="tabular text-right text-muted-foreground">{v}</span>
              </div>
            {/each}
          </div>
          <div class="border-t pt-4 sm:col-span-2">
            <div class="flex items-center gap-2 text-sm font-extrabold"><Target class="size-4" strokeWidth={1.6} /> To improve</div>
            <ul class="mt-2 grid gap-2 text-sm">
              <li class="flex items-start gap-2"><span class="mt-[7px] size-1.5 shrink-0 rounded-full bg-warning"></span>Lead with the result, then the method.</li>
              <li class="flex items-start gap-2"><span class="mt-[7px] size-1.5 shrink-0 rounded-full bg-warning"></span>Name the trade-off you chose and why.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- Any job -->
  <section class="mx-auto max-w-[1200px] px-5 pb-20 text-center xl:px-0" use:reveal>
    <h2 class="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-4xl">An interviewer for any job</h2>
    <p class="mt-3 text-base text-muted-foreground">Make one for your role in a minute.</p>
    <div class="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-6 sm:gap-14">
      {#each anyJob as a (a.name)}
        <div class="flex flex-col items-center">
          <InterviewerAvatar name={a.name} class="size-14 transition-transform duration-300 hover:-rotate-6 sm:size-24" />
          <span class="mt-3 inline-flex h-7 items-center rounded-full border px-2.5 text-[13px] font-medium">{a.tag}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- CTA -->
  <section class="bg-muted">
    <div class="mx-auto flex min-h-[272px] max-w-[1200px] flex-col items-center justify-center gap-6 px-5 py-14 text-center">
      <h2 class="text-[28px] leading-[1.2] font-extrabold tracking-[-0.02em] sm:text-4xl">Practise before it counts.</h2>
      <Button href={startHref} class="h-10 px-6"><Mic /> Start free interview</Button>
    </div>
  </section>

  <footer class="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-muted-foreground xl:px-0">
    <Logo class="text-base" />
    <span>Free plan: {data.limits.interviews} interviews · © {new Date().getFullYear()} PrepMe</span>
  </footer>
</div>

<style>
  .landing-wave {
    transform-origin: center;
    animation: landing-wave 1.1s ease-in-out infinite alternate;
  }
  @keyframes landing-wave {
    from { transform: scaleY(0.45); }
    to { transform: scaleY(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .landing-wave { animation: none; }
  }
</style>
