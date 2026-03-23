<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import {
    BotMessageSquare,
    Video,
    BrainCircuit,
    Calendar,
    ArrowRight,
    Star,
    CheckCircle2,
    Sparkles
  } from '@lucide/svelte';
</script>

<div class="min-h-screen bg-background">
  <!-- Navbar -->
  <nav class="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
      <a href="/" class="text-xl font-bold tracking-tight">
        <span class="text-primary">Prep</span>Me<span class="text-primary">.ai</span>
      </a>
      <div class="flex items-center gap-3">
        <Button variant="ghost" href="/auth/sign-in">Sign in</Button>
        <Button href="/auth/sign-up">Get Started</Button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
    <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
      <Sparkles class="size-4" />
      <span>AI-powered interview preparation</span>
    </div>
    <h1 class="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1] mb-6">
      Ace your next interview<br />
      <span class="text-primary">with AI practice</span>
    </h1>
    <p class="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
      Create custom AI interviewers, run realistic mock interviews over video, and get instant
      feedback to sharpen your skills before the real thing.
    </p>
    <div class="flex items-center justify-center gap-4">
      <Button size="lg" href="/auth/sign-up" class="text-base px-8">
        Start Practicing Free
        <ArrowRight class="size-4" />
      </Button>
      <Button size="lg" variant="outline" href="/auth/sign-in" class="text-base px-8">
        Sign in
      </Button>
    </div>
  </section>

  <!-- Features Section -->
  <section class="border-t border-border/50 bg-muted/30 py-24">
    <div class="mx-auto max-w-6xl px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Everything you need to prepare
        </h2>
        <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
          From creating your AI interviewer to getting actionable feedback, PrepMe covers the full
          interview prep workflow.
        </p>
      </div>
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border bg-card p-6 shadow-sm">
          <div
            class="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <BotMessageSquare class="size-6" />
          </div>
          <h3 class="mb-2 font-semibold text-lg">Custom AI Agents</h3>
          <p class="text-sm text-muted-foreground">
            Build interviewers tailored to specific roles, companies, and difficulty levels.
          </p>
        </div>
        <div class="rounded-xl border bg-card p-6 shadow-sm">
          <div
            class="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Video class="size-6" />
          </div>
          <h3 class="mb-2 font-semibold text-lg">Live Video Interviews</h3>
          <p class="text-sm text-muted-foreground">
            Practice in real-time video sessions that simulate actual interview conditions.
          </p>
        </div>
        <div class="rounded-xl border bg-card p-6 shadow-sm">
          <div
            class="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <BrainCircuit class="size-6" />
          </div>
          <h3 class="mb-2 font-semibold text-lg">AI Feedback</h3>
          <p class="text-sm text-muted-foreground">
            Get detailed analysis of your responses with actionable tips to improve.
          </p>
        </div>
        <div class="rounded-xl border bg-card p-6 shadow-sm">
          <div
            class="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Calendar class="size-6" />
          </div>
          <h3 class="mb-2 font-semibold text-lg">Schedule & Track</h3>
          <p class="text-sm text-muted-foreground">
            Book interview sessions and track your progress over time.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="py-24">
    <div class="mx-auto max-w-6xl px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How it works</h2>
        <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
          Three simple steps to better interview performance.
        </p>
      </div>
      <div class="grid gap-12 md:grid-cols-3">
        <div class="text-center">
          <div
            class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold"
          >
            1
          </div>
          <h3 class="mb-2 text-xl font-semibold">Create an AI Agent</h3>
          <p class="text-muted-foreground">
            Define the role, expertise, and interview style for your AI interviewer.
          </p>
        </div>
        <div class="text-center">
          <div
            class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold"
          >
            2
          </div>
          <h3 class="mb-2 text-xl font-semibold">Schedule an Interview</h3>
          <p class="text-muted-foreground">
            Pick a time and join a live video call with your AI interviewer.
          </p>
        </div>
        <div class="text-center">
          <div
            class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold"
          >
            3
          </div>
          <h3 class="mb-2 text-xl font-semibold">Review & Improve</h3>
          <p class="text-muted-foreground">
            Get AI-generated feedback and refine your answers for next time.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Social Proof / Highlights -->
  <section class="border-t border-border/50 bg-muted/30 py-24">
    <div class="mx-auto max-w-6xl px-6">
      <div class="grid gap-8 md:grid-cols-3 text-center">
        <div>
          <div class="flex items-center justify-center gap-1 mb-2">
            {#each Array(5) as _}
              <Star class="size-5 fill-primary text-primary" />
            {/each}
          </div>
          <p class="text-muted-foreground text-sm">
            "Felt like a real interview. The AI asked great follow-up questions."
          </p>
        </div>
        <div>
          <div class="flex items-center justify-center gap-1 mb-2">
            {#each Array(5) as _}
              <Star class="size-5 fill-primary text-primary" />
            {/each}
          </div>
          <p class="text-muted-foreground text-sm">
            "I practiced daily for a week and landed my dream job. Highly recommend!"
          </p>
        </div>
        <div>
          <div class="flex items-center justify-center gap-1 mb-2">
            {#each Array(5) as _}
              <Star class="size-5 fill-primary text-primary" />
            {/each}
          </div>
          <p class="text-muted-foreground text-sm">
            "The video format made all the difference. Way better than just text-based prep."
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing Teaser -->
  <section class="py-24">
    <div class="mx-auto max-w-2xl px-6 text-center">
      <h2 class="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Start free, upgrade anytime</h2>
      <p class="text-muted-foreground text-lg mb-8">
        Get started with free practice sessions. Upgrade to unlock unlimited agents, interviews, and
        premium AI feedback.
      </p>
      <div class="rounded-xl border bg-card p-8 shadow-sm">
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 text-left">
            <CheckCircle2 class="size-5 text-primary shrink-0" />
            <span>Create custom AI interview agents</span>
          </div>
          <div class="flex items-center gap-3 text-left">
            <CheckCircle2 class="size-5 text-primary shrink-0" />
            <span>Live video mock interviews</span>
          </div>
          <div class="flex items-center gap-3 text-left">
            <CheckCircle2 class="size-5 text-primary shrink-0" />
            <span>AI-powered performance feedback</span>
          </div>
          <div class="flex items-center gap-3 text-left">
            <CheckCircle2 class="size-5 text-primary shrink-0" />
            <span>Interview history & progress tracking</span>
          </div>
        </div>
        <div class="mt-8">
          <Button size="lg" href="/auth/sign-up" class="text-base px-8">
            Get Started Free
            <ArrowRight class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-border/50 py-12">
    <div class="mx-auto max-w-6xl px-6 flex flex-col items-center gap-4 text-center">
      <a href="/" class="text-lg font-bold tracking-tight">
        <span class="text-primary">Prep</span>Me<span class="text-primary">.ai</span>
      </a>
      <p class="text-sm text-muted-foreground">
        AI-powered interview preparation. Practice smarter, land the job.
      </p>
      <p class="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} PrepMe.ai. All rights reserved.
      </p>
    </div>
  </footer>
</div>
