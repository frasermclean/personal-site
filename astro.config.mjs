import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, fontProviders } from 'astro/config';
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
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-geist',
      weights: ['100 800']
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono'
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Sora',
      cssVariable: '--font-sora',
      weights: ['100 800']
    }
  ],
  adapter: cloudflare({
    imageService: {
      build: 'compile',
      runtime: 'cloudflare-binding'
    }
  }),
  env: {
    schema: {
      ANALYTICS_WEBSITE_ID: envField.string({ context: 'client', access: 'public' }),
      ANALYTICS_SCRIPT_SRC: envField.string({ context: 'client', access: 'public' }),
      ANALYTICS_DOMAIN: envField.string({ context: 'client', access: 'public', optional: true }),
      ANALYTICS_PERFORMANCE: envField.boolean({ context: 'client', access: 'public', default: false }),
      CONTACT_EMAIL: envField.string({ context: 'server', access: 'secret' }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
      WORKERS_CI_COMMIT_SHA: envField.string({ context: 'client', access: 'public', optional: true }),
      GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'public' }),
      GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
      GITHUB_REDIRECT_URI: envField.string({ context: 'server', access: 'public' }),
      OWNER_GITHUB_ID: envField.string({ context: 'server', access: 'secret', optional: true })
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
