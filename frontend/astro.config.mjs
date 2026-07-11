import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        if (item.url === 'https://valtracker.live/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        if (item.url.includes('/app')) {
          item.priority = 0.9;
        }
        if (item.url.includes('/overlay')) {
          item.priority = 0.6;
        }
        return item;
      }
    })
  ],
  output: 'server',
  adapter: vercel(),
  site: 'https://valtracker.live',
  server: {
    port: 4321,
    host: true
  },
  vite: {
    build: {
      cssMinify: true
    },
    server: {
      proxy: {
        '/api': 'http://localhost:5000'
      }
    }
  }
});
