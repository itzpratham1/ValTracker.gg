import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate } from './entrypoint_SgFO6Uyl.mjs';
import { $ as $$Layout } from './Layout_CU9nldol.mjs';

const $$App = createComponent(($$result, $$props, $$slots) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ValTracker - Valorant Stats Tracker",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "url": "https://valtracker.live/app",
    "description": "Track your Valorant competitive match history, weapon accuracy, agent performance, and maps. AI-powered coaching included.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Match history tracking",
      "Weapon accuracy stats",
      "Agent performance analytics",
      "Map win rates",
      "RR rank graph",
      "AI coaching tips",
      "Performance diagnostics"
    ]
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "ValTracker — Valorant Stats Tracker", "description": "ValTracker is a premium, real-time stats tracker for Valorant. Analyse your competitive match history, weapon accuracy, maps, and agent performance.", "structuredData": structuredData }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "AppShell", null, { "client:only": "svelte", "initialView": "tracker", "client:component-hydration": "only", "client:component-path": "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/components/tracker/AppShell.svelte", "client:component-export": "default" })} ` })}`;
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/app.astro", void 0);

const $$file = "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/app.astro";
const $$url = "/app";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$App,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
