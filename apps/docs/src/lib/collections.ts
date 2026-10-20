import { pageSchema } from 'fumadocs-core/source/schema'
import { applyMdxPreset } from 'fumadocs-mdx/config'
import { defineDocs } from 'fumadocs-mdx/macro'
import { z } from 'zod'

export const docs = defineDocs({
  dir: '../../docs',
  docs: {
    async: true,
    files: ['**/*.mdx'],
    // Shiki output hides each fence's language class; the kit's CodeBlock highlights instead.
    mdxOptions: applyMdxPreset({ rehypeCodeOptions: false }),
    schema: pageSchema.extend({
      sidebarTitle: z.string().optional(),
    }),
  },
})
