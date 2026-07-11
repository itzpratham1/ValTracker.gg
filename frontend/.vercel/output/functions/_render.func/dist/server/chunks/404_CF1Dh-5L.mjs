import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate, m as maybeRenderHead } from './entrypoint_SgFO6Uyl.mjs';
import { $ as $$Layout } from './Layout_CU9nldol.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "404 // AGENT DE-SYNCHRONIZED — ValTracker", "noIndex": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main style="display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px;"> <div style="text-align:center;"> <h1 style="font-family:'Rajdhani',sans-serif; font-size:72px; font-weight:700; color:var(--accent); line-height:1;">404</h1> <p style="font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:var(--muted); margin-top:8px;">
AGENT DE-SYNCHRONIZED
</p> <p style="font-family:'DM Mono',monospace; font-size:11px; color:var(--muted2); margin-top:16px;">
This page doesn't exist. Try heading back to the tracker.
</p> <a href="/" style="display:inline-block; margin-top:24px; padding:10px 24px; background:var(--accent); color:#0d0d0f; font-family:'Inter',sans-serif; font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-radius:var(--radius-sm); transition:var(--transition);">
Go Home
</a> </div> </main> ` })}`;
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/404.astro", void 0);

const $$file = "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
