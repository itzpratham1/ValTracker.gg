const prerender = false;
const GET = async ({ params }) => {
  const { filename } = params;
  if (!filename) {
    return new Response("Not Found", { status: 404 });
  }
  const backendUrl = "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/shared-image/${filename}`);
    if (!res.ok) {
      return new Response("Not Found", { status: 404 });
    }
    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    console.error("[ASTRO SHARED IMAGE PROXY ERROR]", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
