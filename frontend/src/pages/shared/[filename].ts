export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const { filename } = params;
  if (!filename) {
    return new Response('Not Found', { status: 404 });
  }

  // Use the production or development API base URL
  const backendUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const res = await fetch(`${backendUrl}/api/shared-image/${filename}`);
    if (!res.ok) {
      return new Response('Not Found', { status: 404 });
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('[ASTRO SHARED IMAGE PROXY ERROR]', error);
    return new Response('Internal Server Error', { status: 500 });
  }
};
