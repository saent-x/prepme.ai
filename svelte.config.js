import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	compilerOptions: {
		// async flag
		experimental: { async: true }
	},
	kit: {
		experimental: {
			remoteFunctions: true
		},
		adapter: adapter()
	}
};

export default config;
