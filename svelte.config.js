import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // The runtime follows package.json "engines" (Node 24). Node 20 is retired on Vercel.
    adapter: adapter()
  }
};

export default config;
