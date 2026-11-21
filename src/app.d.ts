import type { AuthSession } from '$lib/auth';

declare global {
  namespace App {
    interface Locals {
      user: AuthSession['user'] | null;
      session: AuthSession['session'] | null;
    }
    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
