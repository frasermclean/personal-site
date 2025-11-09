import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { remarkReadingTime } from './src/lib/reading-time.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://next.frasermclean.com',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      themes: {
        light: 'light-plus',
        dark: 'dark-plus'
      }
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
