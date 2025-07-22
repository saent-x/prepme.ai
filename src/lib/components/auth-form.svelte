<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Github } from '@lucide/svelte';
  import { cn } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';
  import { signInSchema, signUpSchema } from '$lib/validations/auth';
  import { ZodError } from 'zod';
  import { signInGithub, signInGoogle, signInMicrosoft } from '$lib/auth-client';

  type AuthType = 'sign-in' | 'sign-up';
  type Props = {
    class?: string;
    authType: AuthType;
    name?: string;
    email: string;
    password: string;
    confirmPassword?: string;
    processing: boolean;
    onSubmit?: () => void;
  } & HTMLAttributes<HTMLDivElement>;

  let {
    class: className,
    authType,
    onSubmit,
    name = $bindable(),
    email = $bindable(),
    password = $bindable(),
    confirmPassword = $bindable(),
    processing = $bindable(),
    ...restProps
  }: Props = $props();
  const id = $props.id();

  let errors: Record<string, string[]> = $state({});

  function validateForm() {
    try {
      if (authType === 'sign-in') {
        signInSchema.parse({ email, password });
      } else {
        signUpSchema.parse({ name, email, password, confirmPassword });
      }
      errors = {} as Record<string, string[]>;
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        errors = error.formErrors.fieldErrors as Record<string, string[]>;
        console.log(errors);
      }
      return false;
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (validateForm() && onSubmit) {
      onSubmit();
    }
  }
</script>

<div class={cn('flex flex-col gap-6', className)} {...restProps}>
  <Card.Root class="overflow-hidden p-0">
    <Card.Content class="grid p-0 md:grid-cols-2">
      <form class="p-6 md:p-8" onsubmit={handleSubmit}>
        <div class="flex flex-col gap-6">
          {#if authType === 'sign-up'}
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">Get Started!</h1>
              <p class="text-muted-foreground text-balance">Register your PrepMe account</p>
            </div>
          {:else}
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">Welcome back</h1>
              <p class="text-muted-foreground text-balance">Sign in to your PrepMe account</p>
            </div>
          {/if}

          {#if authType === 'sign-up'}
            <div class="grid gap-3">
              <Label for="username-{id}">Username</Label>
              <Input
                id="username-{id}"
                type="text"
                bind:value={name}
                placeholder="Enter your username"
                required
                aria-invalid={errors.name ? 'true' : undefined}
              />
              {#if errors.name}
                {#each errors.name as name_error}
                  <p class="text-destructive text-sm">{name_error}</p>
                {/each}
              {/if}
            </div>
          {/if}
          <div class="grid gap-3">
            <Label for="email-{id}">Email</Label>
            <Input
              id="email-{id}"
              type="email"
              bind:value={email}
              placeholder="m@example.com"
              required
              aria-invalid={errors.email ? 'true' : undefined}
            />
            {#if errors.email}
              {#each errors.email as email_error}
                <p class="text-destructive text-sm">{email_error}</p>
              {/each}
            {/if}
          </div>
          <div class="grid gap-3">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              {#if authType === 'sign-in'}
                <a href="##" class="ml-auto text-sm underline-offset-2 hover:underline">
                  Forgot your password?
                </a>
              {/if}
            </div>
            <Input
              id="password-{id}"
              bind:value={password}
              type="password"
              required
              aria-invalid={errors.password ? 'true' : undefined}
            />
            {#if errors.password}
              {#each errors.password as password_error}
                <p class="text-destructive text-sm">{password_error}</p>
              {/each}
            {/if}
          </div>

          {#if authType === 'sign-up'}
            <div class="grid gap-3">
              <div class="flex items-center">
                <Label for="password">ConfirmPassword</Label>
              </div>
              <Input
                id="confirm-password-{id}"
                bind:value={confirmPassword}
                type="password"
                required
                aria-invalid={errors.email ? 'true' : undefined}
              />
              {#if errors.confirmPassword}
                {#each errors.confirmPassword as confirm_password_error}
                  <p class="text-destructive text-sm">{confirm_password_error}</p>
                {/each}
              {/if}
            </div>
          {/if}

          {#if authType === 'sign-up'}
            <Button type="submit" disabled={processing} class="w-full"
              >{processing ? 'Signing up...' : 'Sign up'}</Button
            >
          {:else}
            <Button type="submit" disabled={processing} class="w-full"
              >{processing ? 'Signing in...' : 'Sign in'}</Button
            >
          {/if}
          <div
            class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
          >
            <span class="bg-card text-muted-foreground relative z-10 px-2"> Or continue with </span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              type="button"
              class="w-full cursor-pointer"
              onclick={() => signInGithub()}
            >
              <Github />
              <span class="sr-only">Login with Github</span>
            </Button>
            <Button
              variant="outline"
              type="button"
              class="w-full cursor-pointer"
              onclick={() => signInGoogle()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              <span class="sr-only">Login with Google</span>
            </Button>
            <Button
              variant="outline"
              type="button"
              class="w-full cursor-pointer"
              onclick={() => signInMicrosoft()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.2em"
                height="1.2em"
                viewBox="0 0 24 24"
                ><path fill="currentColor" d="M2 3h9v9H2zm9 19H2v-9h9zM21 3v9h-9V3zm0 19h-9v-9h9z"
                ></path></svg
              >
              <span class="sr-only">Login with Microsoft</span>
            </Button>
          </div>
          {#if authType === 'sign-up'}
            <div class="text-center text-sm">
              Already have an account?
              <a href="/auth/sign-in" class="underline underline-offset-4"> Sign in </a>
            </div>
          {:else}
            <div class="text-center text-sm">
              Don&apos;t have an account?
              <a href="/auth/sign-up" class="underline underline-offset-4"> Sign up </a>
            </div>
          {/if}
        </div>
      </form>
      <div class="bg-muted relative hidden md:block">
        <enhanced:img
          src="/static/auth-image-min.png"
          alt="placeholder"
          class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </Card.Content>
  </Card.Root>
  <div
    class="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4"
  >
    By clicking continue, you agree to our <a href="##">Terms of Service</a>
    and
    <a href="##">Privacy Policy</a>.
  </div>
</div>
