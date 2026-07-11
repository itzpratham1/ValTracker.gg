import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { k as renderTemplate, q as renderSlot, p as renderHead, u as unescapeHTML, h as addAttribute } from './entrypoint_SgFO6Uyl.mjs';
import 'clsx';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title,
    description = "ValTracker is a premium, real-time stats tracker for Valorant. Analyse your competitive match history, weapon accuracy, maps, and agent performance.",
    ogImage = "/og-image.png",
    noIndex = false,
    structuredData
  } = Astro2.props;
  const canonicalURL = new URL(Astro2.url.pathname, "https://valtracker.live");
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ValTracker",
    "url": "https://valtracker.live",
    "description": description,
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Person",
      "name": "Pratham"
    },
    "screenshot": "https://valtracker.live/stats_tracker_card.webp",
    "featureList": [
      "Real-time Valorant stats tracking",
      "AI-powered coaching",
      "OBS stream overlay",
      "Match history analysis",
      "Weapon accuracy stats",
      "Agent performance tracking",
      "VCT esports coverage",
      "Skin store browser",
      "Meta comp architect"
    ]
  };
  const jsonLd = structuredData || defaultStructuredData;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#030304">', "<title>", '</title><meta name="description"', '><link rel="canonical"', '><!-- Open Graph --><meta property="og:title"', '><meta property="og:description"', '><meta property="og:type" content="website"><meta property="og:url"', '><meta property="og:image"', '><meta property="og:site_name" content="ValTracker"><!-- Twitter Card --><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', '><!-- Structured Data --><script type="application/ld+json">', '<\/script><!-- Favicon --><link rel="icon" type="image/png" href="/logo.png"><link rel="shortcut icon" href="/logo.png" type="image/x-icon"><link rel="apple-touch-icon" href="/logo.png"><!-- Fonts --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Barlow+Condensed:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">', "</head> <body> ", " <!-- Service Worker cleanup to prevent aggressive caching from old architecture --> <script>\n    if ('serviceWorker' in navigator) {\n      navigator.serviceWorker.getRegistrations().then(function(registrations) {\n        for (var registration of registrations) {\n          registration.unregister().then(function(success) {\n            if (success) console.log('[ValTracker] Unregistered active service worker.');\n          });\n        }\n      });\n    }\n    if ('caches' in window) {\n      caches.keys().then(function(keys) {\n        keys.forEach(function(key) {\n          caches.delete(key).then(function() {\n            console.log('[ValTracker] Cleared cache storage:', key);\n          });\n        });\n      });\n    }\n  <\/script> </body> </html>"])), noIndex && renderTemplate`<meta name="robots" content="noindex, nofollow">`, title, addAttribute(description, "content"), addAttribute(canonicalURL.href, "href"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(canonicalURL.href, "content"), addAttribute(ogImage, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), unescapeHTML(JSON.stringify(jsonLd)), renderHead(), renderSlot($$result, $$slots["default"]));
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
