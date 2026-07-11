import { c as createComponent } from './astro-component_jpxNqAqi.mjs';
import 'piccolore';
import { o as renderComponent, k as renderTemplate, h as addAttribute, m as maybeRenderHead } from './entrypoint_SgFO6Uyl.mjs';
import { $ as $$Layout } from './Layout_CU9nldol.mjs';

const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  let meta = {};
  let imageUrl = "";
  let shareUrl = "";
  let error = false;
  try {
    const backendUrl = undefined                               || "http://localhost:5000";
    const res = await fetch(`${backendUrl}/api/share-meta/${id}`);
    if (res.ok) {
      const data = await res.json();
      meta = data.meta || {};
    } else {
      error = true;
    }
  } catch {
    error = true;
  }
  const host = Astro2.url.origin;
  const ext = meta.ext || "png";
  imageUrl = `${host}/shared/${id}.${ext}`;
  shareUrl = `${host}/share/${id}`;
  const playerName = meta.playerName || "ValTracker Player";
  const playerTag = meta.playerTag || "GG";
  const agentName = meta.agentName || "VALORANT Agent";
  const mapName = meta.mapName || "VALORANT Map";
  const won = meta.won || false;
  const score = meta.score || "";
  const isDraftCoach = playerName === "Draft Coach";
  const outcome = won ? "VICTORY" : "DEFEAT";
  const pName = `${playerName}#${playerTag}`;
  const ogTitle = isDraftCoach ? `VCT Draft Coach Comp for ${mapName.toUpperCase()} with Rating ${score}/100!` : `${pName} secured a huge ${outcome}${score ? ` (${score})` : ""} as ${agentName.toUpperCase()} on ${mapName.toUpperCase()}!`;
  const ogDesc = isDraftCoach ? `Check out this 5-agent team composition drafted on ValTracker. View evaluation details and build your own meta comp.` : "Combat ACS & Stats diagnosed automatically. See the full Performance Infographic Card live on ValTracker!";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "ValTracker — Performance Flex Card", "noIndex": true }, { "default": async ($$result2) => renderTemplate`  <meta name="twitter:card" content="summary_large_image"> <meta name="twitter:site" content="@itzpratham01"> <meta name="twitter:creator" content="@itzpratham01"> <meta name="twitter:url"${addAttribute(shareUrl, "content")}> <meta name="twitter:title"${addAttribute(ogTitle, "content")}> <meta name="twitter:description"${addAttribute(ogDesc, "content")}> <meta name="twitter:image"${addAttribute(imageUrl, "content")}> <meta name="twitter:image:alt" content="VALORANT Match Infographic Card"> <meta property="og:type" content="website"> <meta property="og:url"${addAttribute(shareUrl, "content")}> <meta property="og:title"${addAttribute(ogTitle, "content")}> <meta property="og:description"${addAttribute(ogDesc, "content")}> <meta property="og:image"${addAttribute(imageUrl, "content")}> <meta property="og:image:secure_url"${addAttribute(imageUrl, "content")}> <meta property="og:image:type" content="image/png"> <meta property="og:image:width" content="900"> <meta property="og:image:height" content="535"> <meta property="og:site_name" content="ValTracker"> <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Barlow+Condensed:wght@800;900&family=DM+Mono:wght@500&display=swap" rel="stylesheet"> ${error ? renderTemplate`${maybeRenderHead()}<div style="text-align:center; padding:60px 20px; font-family:'Rajdhani',sans-serif;"> <h1 style="font-size:48px; color:#ff4655; margin-bottom:12px;">Card Not Found</h1> <p style="font-family:'DM Mono',monospace; font-size:12px; color:rgba(255,255,255,0.5); margin-bottom:24px;">This share link may have expired or been removed.</p> <a href="/" style="background:linear-gradient(135deg, #ff4655, #e8ff47); color:#000; border:none; border-radius:8px; padding:12px 28px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; text-transform:uppercase; letter-spacing:1px; cursor:pointer; text-decoration:none; display:inline-block;">
Go to ValTracker
</a> </div>` : renderTemplate`<div style="max-width:900px; width:95%; margin:20px auto; text-align:center; display:flex; flex-direction:column; align-items:center; gap:20px;"> <a href="/" style="display:flex; align-items:center; gap:8px; text-decoration:none; margin-bottom:5px;"> <svg viewBox="0 0 24 24" style="width:24px; height:24px; fill:none; filter:drop-shadow(0 0 6px rgba(255, 70, 85, 0.6));"> <path d="M2,2 L10.5,22 L13.5,22 L22,2 L17.5,2 L12,13 L6.5,2 Z" fill="#ff4655"></path> <polygon points="12,2 15.5,6 12,10 8.5,6" fill="#e8ff47"></polygon> </svg> <span style="font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:900; letter-spacing:1px; color:#fff; text-transform:uppercase;">ValTracker</span> </a> <div style="display:inline-block; padding:4px 12px; border-radius:20px; background:rgba(255, 70, 85, 0.12); border:1px solid rgba(255, 70, 85, 0.3); color:#ff4655; font-family:'DM Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;"> ${isDraftCoach ? "VCT Draft Coach Card" : "Match Flex Card"} </div> <img${addAttribute(imageUrl, "src")}${addAttribute(isDraftCoach ? "Valorant VCT Draft Coach Card" : "Valorant Performance Flex Card", "alt")} style="width:100%; max-width:850px; border-radius:16px; border:1px solid rgba(255, 70, 85, 0.3); box-shadow:0 16px 48px rgba(0,0,0,0.8), 0 0 15px rgba(255, 70, 85, 0.15); background:#0b0b0e; display:block; transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);" onmouseover="this.style.transform='scale(1.01) translateY(-2px)'" onmouseout="this.style.transform='scale(1) translateY(0)'"> <a${addAttribute(isDraftCoach ? "/app#meta" : `/?player=${encodeURIComponent(playerName)}%23${encodeURIComponent(playerTag)}`, "href")} style="background:linear-gradient(135deg, #ff4655 0%, #e8ff47 100%); color:#000; border:none; border-radius:8px; padding:12px 28px; font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; text-transform:uppercase; letter-spacing:1px; cursor:pointer; text-decoration:none; box-shadow:0 4px 15px rgba(255, 70, 85, 0.3); transition:all 0.2s; margin-top:10px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 70, 85, 0.4), 0 0 10px rgba(232, 255, 71, 0.2)'; this.style.filter='brightness(1.05)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 70, 85, 0.3)'; this.style.filter='none'"> ${isDraftCoach ? "Build Your Own Meta Comp" : "View Full Performance Telemetry"} </a> </div>`}` })}`;
}, "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/share/[id].astro", void 0);
const $$file = "C:/Users/prath/Downloads/VALSTATS/v8/frontend/src/pages/share/[id].astro";
const $$url = "/share/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$id,
    file: $$file,
    prerender,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
