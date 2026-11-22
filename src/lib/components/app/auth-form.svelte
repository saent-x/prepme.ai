<script lang="ts">
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { z } from 'zod';
  import { authClient, type SocialProvider } from '$lib/auth-client';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { LoaderCircle } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    mode,
    providers,
    next
  }: { mode: 'sign-in' | 'sign-up'; providers: SocialProvider[]; next: string } = $props();

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  // Sign-in runs in JS; keep the buttons off until the page has hydrated so an
  // early click can't fall through to a plain form submit.
  let ready = $state(false);
  onMount(() => (ready = true));
  let errors = $state<Record<string, string>>({});

  const schema = $derived(
    z.object({
      name: mode === 'sign-up' ? z.string().trim().min(2, 'Enter your name') : z.string().optional(),
      email: z.email('Enter a valid email'),
      password: z.string().min(8, 'At least 8 characters')
    })
  );

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success) {
      errors = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
      return;
    }
    errors = {};
    busy = true;
    const res =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ name: name.trim(), email, password });
    busy = false;
    if (res.error) {
      toast.error(res.error.message ?? 'Something went wrong. Please try again.');
      return;
    }
    // Capture the target first: re-running the auth layout load now that the
    // user is signed in redirects, which would leave `next` undefined.
    const target = next || '/dashboard';
    await goto(target, { invalidateAll: true });
  }

  async function social(provider: SocialProvider) {
    busy = true;
    const res = await authClient.signIn.social({ provider, callbackURL: next });
    if (res?.error) {
      busy = false;
      toast.error(res.error.message ?? `Could not sign in with ${provider}.`);
    }
  }

  const labels: Record<SocialProvider, string> = { github: 'GitHub', google: 'Google', microsoft: 'Microsoft' };
  const switchHref = $derived(
    `/auth/${mode === 'sign-in' ? 'sign-up' : 'sign-in'}${next !== '/dashboard' ? `?redirect=${encodeURIComponent(next)}` : ''}`
  );
</script>

<h1 class="text-2xl font-extrabold tracking-tight">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1>
<p class="mt-1 text-sm text-muted-foreground">
  {mode === 'sign-in' ? 'Sign in to continue practising.' : '5 free interviews. No card needed.'}
</p>

{#if providers.length}
  <div class="mt-6 grid gap-2">
    {#each providers as p}
      <Button variant="outline" size="lg" class="w-full" disabled={busy || !ready} onclick={() => social(p)}>
        Continue with {labels[p]}
      </Button>
    {/each}
  </div>
  <div class="my-5 flex items-center gap-3 text-xs text-muted-foreground">
    <span class="h-px flex-1 bg-border"></span>or use email<span class="h-px flex-1 bg-border"></span>
  </div>
{:else}
  <div class="mt-6"></div>
{/if}

<form class="grid gap-4" onsubmit={submit} novalidate>
  {#if mode === 'sign-up'}
    <div class="grid gap-1.5">
      <Label for="name">Name</Label>
      <Input id="name" autocomplete="name" bind:value={name} aria-invalid={!!errors.name} class="h-10" />
      {#if errors.name}<p class="text-sm text-destructive">{errors.name}</p>{/if}
    </div>
  {/if}
  <div class="grid gap-1.5">
    <Label for="email">Email</Label>
    <Input id="email" type="email" autocomplete="email" bind:value={email} aria-invalid={!!errors.email} class="h-10" />
    {#if errors.email}<p class="text-sm text-destructive">{errors.email}</p>{/if}
  </div>
  <div class="grid gap-1.5">
    <Label for="password">Password</Label>
    <Input
      id="password"
      type="password"
      autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
      bind:value={password}
      aria-invalid={!!errors.password}
      class="h-10"
    />
    {#if errors.password}<p class="text-sm text-destructive">{errors.password}</p>{/if}
  </div>
  <Button type="submit" size="lg" class="mt-2 w-full" disabled={busy || !ready}>
    {#if busy}<LoaderCircle class="animate-spin" />{/if}
    {mode === 'sign-in' ? 'Sign in' : 'Create account'}
  </Button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
  {mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}
  <a href={switchHref} class="font-semibold text-primary hover:underline">
    {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
  </a>
</p>
