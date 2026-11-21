<script lang="ts">
  import Logo from '$lib/components/brand/logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import { TEMPLATES } from '$lib/templates';
  import {
    ArrowRight,
    AudioLines,
    BriefcaseBusiness,
    ChartNoAxesCombined,
    MessageCircleQuestion,
    Mic,
    RefreshCw,
    Sparkles
  } from '@lucide/svelte';

  let { data } = $props();

  const features = [
    {
      icon: Sparkles,
      title: 'A stronger answer for every question',
      body: 'Each question gets a score, specific feedback that quotes what you said, and a better answer written in your voice so you can say it out loud next time.',
      wide: true
    },
    {
      icon: BriefcaseBusiness,
      title: 'Tailored to the job',
      body: 'Paste the job description and the interviewer asks about what the role actually needs.'
    },
    {
      icon: AudioLines,
      title: 'Natural turn-taking',
      body: 'It waits for you to finish a thought instead of jumping in on a pause.'
    },
    {
      icon: RefreshCw,
      title: 'Survives a bad connection',
      body: 'Your transcript saves as you talk. If the line drops, the interviewer picks up where you left off.'
    },
    {
      icon: MessageCircleQuestion,
      title: 'Ask the coach',
      body: '“How should I have answered the scaling question?” Chat about your interview afterwards.'
    },
    {
      icon: ChartNoAxesCombined,
      title: 'See yourself improve',
      body: 'Scores and competencies tracked across every session, against a realistic pass bar.',
      wide: true
    }
  ];

  const faqs = [
    {
      q: 'Do I need to install anything?',
      a: 'No. It runs in Chrome, Edge, Safari or Firefox. You only need a microphone.'
    },
    {
      q: 'Is it a real voice conversation?',
      a: 'Yes. You speak and the interviewer answers out loud in real time, with follow-up questions based on what you said.'
    },
    {
      q: 'How is my interview scored?',
      a: 'After the call, the full transcript is reviewed against five competencies (communication, technical depth, problem solving, answer structure and role fit) and calibrated to a real hiring bar: 70 is a solid pass.'
    },
    {
      q: 'What happens to my recordings?',
      a: 'PrepMe does not store audio. Only the text transcript and your feedback are saved to your account, and you can delete an interview at any time.'
    }
  ];
</script>

<svelte:head>
  <title>PrepMe — voice mock interviews with an AI interviewer</title>
</svelte:head>

<div class="min-h-screen overflow-x-clip">
  <!-- Nav -->
  <header class="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md">
    <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <a href="/" aria-label="PrepMe home"><Logo /></a>
      <div class="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
        <a href="#how" class="hover:text-foreground">How it works</a>
        <a href="#features" class="hover:text-foreground">Features</a>
        <a href="#pricing" class="hover:text-foreground">Pricing</a>
        <a href="#faq" class="hover:text-foreground">FAQ</a>
      </div>
      <div class="flex items-center gap-2">
        {#if data.signedIn}
          <Button href="/dashboard" size="sm">Open dashboard <ArrowRight /></Button>
        {:else}
          <Button href="/auth/sign-in" variant="ghost" size="sm">Sign in</Button>
          <Button href="/auth/sign-up" size="sm">Start free</Button>
        {/if}
      </div>
    </nav>
  </header>

  <main>
    <!-- Hero -->
    <section class="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-14 pb-20 md:pt-20 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <p class="eyebrow inline-flex items-center gap-2">
          <span class="size-2 animate-onair rounded-full bg-signal"></span> Voice mock interviews
        </p>
        <h1 class="mt-5 text-[clamp(2.5rem,6vw,4.4rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Practise the interview out loud, before it counts.
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Pick an interviewer, paste the job description and talk. PrepMe runs a realistic voice
          interview, then scores every answer and shows you a stronger one.
        </p>
        <div class="mt-9 flex flex-wrap items-center gap-3">
          <Button href={data.signedIn ? '/dashboard/interviews/new' : '/auth/sign-up'} variant="signal" size="xl">
            <Mic /> Start a free interview
          </Button>
          <Button href="#how" variant="outline" size="xl">See how it works</Button>
        </div>
        <p class="mt-5 text-sm text-muted-foreground">5 free interviews · No card needed · Runs in your browser</p>
      </div>

      <!-- Product mock: live call + scorecard -->
      <div class="relative mx-auto w-full max-w-[520px]" aria-hidden="true">
        <div class="relative overflow-hidden rounded-[28px] bg-[oklch(0.17_0.006_60)] p-6 text-white shadow-[0_40px_120px_-30px_rgba(40,20,10,.45)]">
          <div class="flex items-center justify-between text-xs text-white/60">
            <span class="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 font-mono">
              <span class="size-1.5 animate-onair rounded-full bg-signal"></span> LIVE · 12:41
            </span>
            <span class="font-mono">Senior Software Engineer</span>
          </div>
          <div class="grid place-items-center py-10">
            <div class="relative grid size-44 place-items-center">
              <span class="hero-ring absolute inset-0 rounded-full border border-white/15"></span>
              <span class="hero-ring absolute -inset-5 rounded-full border border-white/10" style="animation-delay:.6s"></span>
              <span class="absolute inset-0 rounded-full bg-signal/50 blur-2xl"></span>
              <span
                class="relative size-32 rounded-full"
                style="background: radial-gradient(circle at 32% 28%, oklch(0.9 0.08 50) 0%, transparent 38%), radial-gradient(circle at 70% 75%, oklch(0.45 0.2 25) 0%, transparent 55%), radial-gradient(circle, oklch(0.68 0.2 36), oklch(0.5 0.2 28));"
              ></span>
            </div>
          </div>
          <div class="rounded-2xl bg-white/6 p-4 text-[15px] leading-relaxed">
            <span class="font-mono text-[11px] tracking-widest text-white/45 uppercase">Interviewer</span>
            <p class="mt-1 text-white/90">
              You said the queue backed up during the launch. What did you change so it couldn't happen again?
            </p>
          </div>
        </div>

        <div class="absolute -bottom-10 -left-6 w-[260px] rotate-[-3deg] rounded-3xl border bg-card p-5 shadow-xl sm:-left-12">
          <div class="flex items-center gap-4">
            <div class="relative grid size-16 place-items-center">
              <svg viewBox="0 0 64 64" class="absolute inset-0 -rotate-90">
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--muted)" stroke-width="6" />
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--success)" stroke-width="6" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="37" />
              </svg>
              <span class="tabular text-lg font-semibold">78</span>
            </div>
            <div>
              <div class="eyebrow">Verdict</div>
              <div class="font-semibold">Hire</div>
            </div>
          </div>
          <div class="mt-4 space-y-2.5">
            {#each [['Communication', 4], ['Technical depth', 4], ['Structure', 3]] as [label, n]}
              <div>
                <div class="mb-1 flex justify-between text-xs"><span>{label}</span><span class="font-mono text-muted-foreground">{n}/5</span></div>
                <div class="flex gap-1">
                  {#each Array(5) as _, i}<span class="h-1.5 flex-1 rounded-full {i < (n as number) ? ((n as number) >= 4 ? 'bg-success' : 'bg-warning') : 'bg-muted'}"></span>{/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </section>

    <!-- Interviewer chips -->
    <section class="border-y bg-card/50">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-3 px-5 py-6">
        <span class="eyebrow mr-2">Interviewers for</span>
        {#each TEMPLATES as t}
          <span class="rounded-full border bg-background px-3.5 py-1.5 text-sm">{t.name}</span>
        {/each}
        <span class="rounded-full border border-dashed px-3.5 py-1.5 text-sm text-muted-foreground">or write your own</span>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
      <p class="eyebrow">How it works</p>
      <h2 class="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance">Three steps, about twenty minutes.</h2>
      <ol class="mt-14 grid gap-5 md:grid-cols-3">
        <li class="rounded-3xl border bg-card p-6">
          <span class="font-mono text-sm text-signal">01</span>
          <h3 class="mt-3 text-lg font-semibold">Set the scene</h3>
          <p class="mt-2 text-muted-foreground">Choose an interviewer, paste the job description and say what you want to focus on.</p>
          <div class="mt-6 space-y-2 rounded-2xl bg-muted p-4 text-sm">
            <div class="flex items-center justify-between rounded-xl bg-card px-3 py-2"><span>Interviewer</span><span class="font-medium">AI Engineer</span></div>
            <div class="flex items-center justify-between rounded-xl bg-card px-3 py-2"><span>Length</span><span class="font-medium">20 min</span></div>
            <div class="rounded-xl bg-card px-3 py-2 text-muted-foreground">“Senior AI Engineer, RAG, evals…”</div>
          </div>
        </li>
        <li class="rounded-3xl border bg-card p-6">
          <span class="font-mono text-sm text-signal">02</span>
          <h3 class="mt-3 text-lg font-semibold">Talk it through</h3>
          <p class="mt-2 text-muted-foreground">A live voice call. It follows up on vague answers and keeps to time.</p>
          <div class="mt-6 flex h-[132px] items-center justify-center gap-1 rounded-2xl bg-[oklch(0.17_0.006_60)] p-4">
            {#each [8, 18, 30, 44, 26, 52, 36, 20, 40, 58, 30, 16, 34, 22, 10] as h, i}
              <span class="wave w-1.5 rounded-full bg-signal" style="height:{h}px;animation-delay:{i * 70}ms"></span>
            {/each}
          </div>
        </li>
        <li class="rounded-3xl border bg-card p-6">
          <span class="font-mono text-sm text-signal">03</span>
          <h3 class="mt-3 text-lg font-semibold">Get your scorecard</h3>
          <p class="mt-2 text-muted-foreground">A score, a verdict, what went well and the three changes that matter most.</p>
          <div class="mt-6 space-y-2 rounded-2xl bg-muted p-4 text-sm">
            <div class="flex items-center justify-between rounded-xl bg-card px-3 py-2"><span>Overall</span><span class="tabular font-semibold">74</span></div>
            <div class="rounded-xl bg-card px-3 py-2"><span class="text-success">✓</span> Clear trade-off reasoning</div>
            <div class="rounded-xl bg-card px-3 py-2"><span class="text-signal">→</span> Quantify the result</div>
          </div>
        </li>
      </ol>
    </section>

    <!-- Features bento -->
    <section id="features" class="scroll-mt-20 border-y bg-card/50">
      <div class="mx-auto max-w-6xl px-5 py-24">
        <p class="eyebrow">Features</p>
        <h2 class="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance">Feedback you can actually use.</h2>
        <div class="mt-14 grid gap-4 md:grid-cols-3">
          {#each features as f}
            <article class="rounded-3xl border bg-background p-6 {f.wide ? 'md:col-span-2' : ''}">
              <span class="grid size-10 place-items-center rounded-xl bg-signal-soft text-signal"><f.icon class="size-5" /></span>
              <h3 class="mt-5 text-lg font-semibold">{f.title}</h3>
              <p class="mt-2 max-w-prose text-muted-foreground">{f.body}</p>
            </article>
          {/each}
        </div>
      </div>
    </section>

    <!-- Sample feedback -->
    <section class="mx-auto max-w-6xl px-5 py-24">
      <div class="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <p class="eyebrow">What the feedback looks like</p>
          <h2 class="mt-3 text-4xl font-semibold tracking-[-0.03em] text-balance">Not “be more confident”.</h2>
          <p class="mt-5 text-lg text-muted-foreground">
            Feedback quotes what you said, explains what an interviewer listens for, and gives you a
            better version to rehearse.
          </p>
        </div>
        <div class="rounded-3xl border bg-card p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <p class="font-medium">“Tell me about a time a project you led went wrong.”</p>
            <span class="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 font-mono text-xs">3/5</span>
          </div>
          <div class="mt-5 space-y-4 text-[15px]">
            <div>
              <div class="eyebrow mb-1">Feedback</div>
              <p class="text-muted-foreground">
                Good ownership: “that was on me” lands well. But you spent most of the answer on the
                situation and never said what changed afterwards or how you measured it.
              </p>
            </div>
            <div class="rounded-2xl border-l-4 border-success bg-success/8 p-4">
              <div class="eyebrow mb-1 text-success">Stronger answer</div>
              <p>
                “We shipped the migration without a rollback plan and lost two hours of orders. I led
                the incident review, added staged rollouts and a one-click rollback, and we've had
                zero failed releases in the six months since.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="scroll-mt-20 border-y bg-card/50">
      <div class="mx-auto max-w-6xl px-5 py-24">
        <p class="eyebrow">Pricing</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.03em]">Start free. Upgrade when it clicks.</h2>
        <div class="mt-12 grid gap-4 md:grid-cols-2">
          <div class="rounded-3xl border bg-background p-7">
            <h3 class="text-lg font-semibold">Free</h3>
            <p class="mt-1 text-muted-foreground">Enough to find out if it helps.</p>
            <ul class="mt-6 space-y-2.5 text-[15px]">
              <li>✓ 5 interviews</li>
              <li>✓ 3 custom interviewers</li>
              <li>✓ Calls up to 20 minutes</li>
              <li>✓ Full scorecard and coach chat</li>
            </ul>
            <Button href="/auth/sign-up" variant="outline" size="lg" class="mt-8">Start free</Button>
          </div>
          <div class="relative rounded-3xl bg-foreground p-7 text-background">
            <span class="absolute top-6 right-6 rounded-full bg-signal px-2.5 py-1 font-mono text-[11px] text-white">PRO</span>
            <h3 class="text-lg font-semibold">Pro</h3>
            <p class="mt-1 opacity-70">For a serious job search.</p>
            <ul class="mt-6 space-y-2.5 text-[15px]">
              <li>✓ Unlimited interviews and interviewers</li>
              <li>✓ Calls up to 45 minutes</li>
              <li>✓ Job-description tailored interviews</li>
            </ul>
            <Button href="/auth/sign-up" variant="signal" size="lg" class="mt-8">Get Pro</Button>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="mx-auto max-w-3xl scroll-mt-20 px-5 py-24">
      <p class="eyebrow">FAQ</p>
      <h2 class="mt-3 text-4xl font-semibold tracking-[-0.03em]">Questions</h2>
      <div class="mt-10 divide-y border-y">
        {#each faqs as f}
          <details class="group py-5">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
              {f.q}
              <span class="text-2xl font-light text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p class="mt-3 text-muted-foreground">{f.a}</p>
          </details>
        {/each}
      </div>
    </section>

    <!-- CTA band -->
    <section class="px-5 pb-24">
      <div class="mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[oklch(0.17_0.006_60)] px-8 py-16 text-center text-white md:py-20">
        <h2 class="mx-auto max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
          Your next interview is a rehearsal away.
        </h2>
        <Button href={data.signedIn ? '/dashboard/interviews/new' : '/auth/sign-up'} variant="signal" size="xl" class="mt-9">
          <Mic /> Start a free interview
        </Button>
      </div>
    </section>
  </main>

  <footer class="border-t">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row">
      <Logo />
      <p>© {new Date().getFullYear()} PrepMe. Practise smarter, interview calmer.</p>
    </div>
  </footer>
</div>

<style>
  .hero-ring {
    animation: hero-ripple 2.6s ease-out infinite;
  }
  @keyframes hero-ripple {
    0% {
      transform: scale(0.9);
      opacity: 1;
    }
    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }
  .wave {
    animation: wave 1.1s ease-in-out infinite alternate;
    transform-origin: center;
  }
  @keyframes wave {
    from {
      transform: scaleY(0.35);
    }
    to {
      transform: scaleY(1);
    }
  }
</style>
