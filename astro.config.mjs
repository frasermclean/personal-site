import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { remarkReadingTime } from './src/lib/reading-time.js';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://next.frasermclean.com',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      themes: {
        light: 'light-plus',
        dark: 'dark-plus',
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
