import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import { remarkReadingTime } from './src/lib/reading-time.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://next.frasermclean.com',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  env: {
    schema: {
      CONTACT_EMAIL: envField.string({ context: 'server', access: 'secret' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' })
    }
  },
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
