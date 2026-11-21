import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  compilerOptions: {
    experimental: {
      async: true
    }
  },
  kit: {
    experimental: {
      remoteFunctions: true
    },
    // Node 20 is end-of-life and no longer accepted by Vercel. The runtime now
    // follows the Node version in package.json "engines" (24.x).
    adapter: adapter()
  }
};

export default config;
