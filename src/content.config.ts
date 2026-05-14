import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const posts = defineCollection({
  loader: glob({ base: 'src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.coerce.date(),
      heroImage: z.object({
        src: image(),
        alt: z.string()
      }),
      category: z.enum(['guide', 'project', 'review']).optional(),
      tags: z.array(z.string()),
      showReactions: z.boolean().default(true),
      isFeatured: z.boolean().default(false),
      syndication: z.array(z.url()).default([])
    })
});

const projects = defineCollection({
  loader: file('src/data/projects.json'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.array(z.string()),
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string()
          })
        )
        .default([]),
      links: z.object({
        website: z.url().optional(),
        source: z.url()
      }),
      features: z.array(z.string()).default([]),
      technologies: z.array(z.string())
    })
});

const bookmarks = defineCollection({
  loader: file('src/data/bookmarks.json'),
  schema: z.object({
    category: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.url()
      })
    )
  })
});

export const collections = { posts, projects, bookmarks };
