import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { remarkReadingTime } from './src/lib/reading-time.js';

// https://astro.build/config
export default defineConfig({
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
