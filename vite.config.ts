import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// Local secrets live in .dev.vars (the Wrangler convention). Load them into
// process.env too, so `$env/dynamic/private` sees the same values in `vite dev`
// as the deployed Worker does. Bindings such as D1 come from platform.env.
if (existsSync('.dev.vars')) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync('.dev.vars', 'utf8')))) {
    process.env[key] ??= value;
  }
}

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    include: ['src/**/*.test.ts']
  }
});
