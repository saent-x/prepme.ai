// Types for the Cloudflare bindings declared in wrangler.jsonc. Only the binding
// types are pulled in, so the Workers runtime types don't clash with the DOM
// types used by browser code.
declare namespace Cloudflare {
  interface Env {
    DB: import('@cloudflare/workers-types').D1Database;
  }
}
