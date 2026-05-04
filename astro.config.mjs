import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import rehypeFigure from 'rehype-figure';
import { remarkExternalLinks } from './src/lib/remark-external-links.ts';
import { remarkReadingTime } from './src/lib/remark-reading-time.js';
import { remarkUpdatedDate } from './src/lib/remark-updated-date.js';

// https://astro.build/config
export default defineConfig({
  site: 'https://frasermclean.com',
  output: 'static',
  trailingSlash: 'never',
  image: {
    layout: 'constrained',
    objectFit: 'cover',
    objectPosition: 'center',
    responsiveStyles: true
  },
  adapter: cloudflare({
    imageService: {
      build: 'compile',
      runtime: 'cloudflare-binding'
    }
  }),
  env: {
    schema: {
      TRACKING_WEBSITE_ID: envField.string({ context: 'client', access: 'public' }),
      TRACKING_SCRIPT_SRC: envField.string({
        context: 'client',
        access: 'public',
        default: 'http://localhost:8081/script.js'
      }),
      COMMENTS_HOST: envField.string({ context: 'client', access: 'public', default: 'http://localhost:8080' }),
      CONTACT_EMAIL: envField.string({ context: 'server', access: 'secret', default: '' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', default: '' }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', default: '1x00000000000000000000AA' }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        default: '1x0000000000000000000000000000000AA'
      }),
      WORKERS_CI_COMMIT_SHA: envField.string({ context: 'client', access: 'public', default: '' })
    }
  },
  integrations: [sitemap(), mdx()],
  markdown: {
    remarkPlugins: [remarkReadingTime, remarkUpdatedDate, remarkExternalLinks],
    rehypePlugins: [rehypeFigure],
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
