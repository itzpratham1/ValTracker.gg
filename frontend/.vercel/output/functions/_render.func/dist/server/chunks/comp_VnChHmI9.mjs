import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_SgFO6Uyl.mjs';
import { $ as $$Layout } from './Layout_CU9nldol.mjs';

const $$Comp = createComponent(($$result, $$props, $$slots) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ValTracker — VCT Meta Compositions",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "url": "https://valtracker.live/comp",
    "description": "Browse VCT pro team compositions, agent pick rates, and win rates for every map. Data updates weekly from pro tournaments.",
    "featureList": [
      "VCT pro meta compositions",
      "Agent pick rates per map",
      "Win rate analysis",
      "Multi-patch comparison"
    ]
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "VCT Meta Comps — ValTracker", "description": "Browse VCT pro team compositions, agent pick rates, and win rates for every map. Data updates weekly from pro tournaments.", "structuredData": structuredData }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AppShell", null, { "client:only": "svelte", "client:component-hydration": "only", "client:component-path": "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/components/tracker/AppShell.svelte", "client:component-export": "default" })} ` })}`;
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/comp.astro", void 0);

const $$file = "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/comp.astro";
const $$url = "/comp";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Comp,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
