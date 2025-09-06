import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [enhancedImages(), tailwindcss(), sveltekit(), devtoolsJson()],
  ssr: {
      noExternal: ["@polar-sh/sdk", "@polar-sh/better-auth"]
    },
    optimizeDeps: {
      exclude: ["@polar-sh/sdk/webhooks.ts"]
    },
  server: {
    allowedHosts: ['big-drake-quietly.ngrok-free.app']
  }
});
