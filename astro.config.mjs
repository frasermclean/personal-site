import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import rehypeFigure from 'rehype-figure';
import { SITE_URL } from './src/constants.ts';
import { remarkExternalLinks } from './src/lib/remark-external-links.ts';
import { remarkReadingTime } from './src/lib/remark-reading-time.js';
import { remarkUpdatedDate } from './src/lib/remark-updated-date.js';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'server',
  trailingSlash: 'never',
  build: {
    assets: '_assets'
  },
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
      ANALYTICS_WEBSITE_ID: envField.string({ context: 'client', access: 'public' }),
      ANALYTICS_SCRIPT_SRC: envField.string({
        context: 'client',
        access: 'public',
        default: 'http://localhost:8081/script.js'
      }),
      CONTACT_EMAIL: envField.string({ context: 'server', access: 'secret', default: '' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', default: '' }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      WORKERS_CI_COMMIT_SHA: envField.string({ context: 'client', access: 'public', default: '' }),
      GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'public', default: '' }),
      GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', default: '' }),
      GITHUB_REDIRECT_URI: envField.string({ context: 'server', access: 'public', default: '' })
    }
  },
  integrations: [sitemap({ customSitemaps: [`${SITE_URL}/sitemap-posts.xml`] }), mdx()],
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
