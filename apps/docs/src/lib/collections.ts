import { pageSchema } from 'fumadocs-core/source/schema'
import { defineDocs } from 'fumadocs-mdx/macro'
import { z } from 'zod'

export const docs = defineDocs({
  dir: '../../docs',
  docs: {
    async: true,
    files: ['**/*.mdx'],
    schema: pageSchema.extend({
      sidebarTitle: z.string().optional(),
    }),
  },
  meta: {
    files: ['**/meta.json'],
  },
})
