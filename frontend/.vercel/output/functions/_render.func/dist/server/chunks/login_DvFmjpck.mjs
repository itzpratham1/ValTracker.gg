import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_SgFO6Uyl.mjs';
import { $ as $$Layout } from './Layout_CU9nldol.mjs';

const $$Login = createComponent(($$result, $$props, $$slots) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "ValTracker Lookup",
    "description": "Look up any Valorant player profile, track match statistics, and view analytical insights instantly."
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "ValTracker — Look Up a Player", "description": "Look up any Valorant player profile. No account or login required—just enter a Riot ID and tag.", "structuredData": structuredData }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "LookupView", null, { "client:only": "svelte", "client:component-hydration": "only", "client:component-path": "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/components/tracker/LookupView.svelte", "client:component-export": "default" })} ` })}`;
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/login.astro", void 0);

const $$file = "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
