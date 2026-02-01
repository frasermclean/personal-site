import { file, glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

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
      enableComments: z.boolean().default(true),
      isFeatured: z.boolean().optional()
    })
});

const projects = defineCollection({
  loader: file('src/data/projects.json'),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    imageFile: z.string().optional(),
    projectUrl: z.string().url().optional(),
    repositoryUrl: z.string().url(),
    technologies: z.array(z.string())
  })
});

export const collections = { posts, projects };
