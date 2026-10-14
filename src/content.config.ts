import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    tagline: z.string(),
    order: z.number(),
    category: z.string(),
    visual: z.enum(['orbital', 'mat144', 'grader', 'axiom']),
    role: z.string(),
    metrics: z.array(z.object({ value: z.string(), label: z.string() })),
    stack: z.array(z.string()),
    links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
});

export const collections = { work };
