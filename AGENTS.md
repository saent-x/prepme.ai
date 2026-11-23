# Agent notes

## ui-sdk

Before using ui-sdk, follow the `ui-sdk` skill if it is installed, and read `node_modules/@ui-sdk/svelte/docs/llms.txt`.

To build a new component, also search `node_modules/@ui-sdk/svelte/docs/core.md` by heading, and read `rendering.md` next to it.

ui-sdk's default stylesheet (`@ui-sdk/core/web.css`) is deliberately not imported: its `[data-slot]` rules collide with the shadcn-svelte components in `src/lib/components/ui`. Style ui-sdk parts with Tailwind and the tokens in `src/app.css`.
