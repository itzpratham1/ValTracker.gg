import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { p as renderHead, o as renderComponent, k as renderTemplate } from './entrypoint_SgFO6Uyl.mjs';

const $$Overlay = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en" data-astro-cid-r6pylhhl> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>Stream Overlay — ValTracker</title><link rel="icon" type="image/png" href="/logo.png"><link rel="shortcut icon" href="/logo.png" type="image/x-icon"><link rel="apple-touch-icon" href="/logo.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,800&family=DM+Mono:wght@500;700&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">${renderHead()}</head> <body data-astro-cid-r6pylhhl> ${renderComponent($$result, "Overlay", null, { "client:only": "svelte", "client:component-hydration": "only", "data-astro-cid-r6pylhhl": true, "client:component-path": "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/components/overlay/Overlay.svelte", "client:component-export": "default" })} </body></html>`;
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/overlay.astro", void 0);

const $$file = "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/overlay.astro";
const $$url = "/overlay";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Overlay,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
