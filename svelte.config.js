import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Builds a Cloudflare Worker with static assets; bindings come from wrangler.jsonc.
    adapter: adapter()
  }
};

export default config;
