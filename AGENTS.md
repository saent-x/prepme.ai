# Agent notes

## ui-sdk

Before using ui-sdk, follow the `ui-sdk` skill if it is installed, and read `node_modules/@ui-sdk/svelte/docs/llms.txt`.

To build a new component, also search `node_modules/@ui-sdk/svelte/docs/core.md` by heading, and read `rendering.md` next to it.

The whole UI is built on ui-sdk. The styled wrappers live in `src/lib/components/ui` (button, input, textarea, label, dialog, alert-dialog, menu, select, tabs, toast, segmented, chips); use those in pages, and add a new wrapper there when a page needs another ui-sdk component. `@ui-sdk/core/web.css` is imported in `src/app.css` and themed through the `--ui-*` tokens on `:root`, which map to the app's own colour tokens. Do not add shadcn-svelte or bits-ui back.
