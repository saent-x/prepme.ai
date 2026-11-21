import type { AuthSession } from '$lib/auth';

declare global {
  namespace App {
    interface Locals {
      user: AuthSession['user'] | null;
      session: AuthSession['session'] | null;
    }
    interface Platform {
      env: Cloudflare.Env;
      ctx: { waitUntil(promise: Promise<unknown>): void };
    }
    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
