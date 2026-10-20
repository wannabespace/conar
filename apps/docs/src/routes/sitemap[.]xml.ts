import { createFileRoute } from '@tanstack/react-router'

import { SITE_URL } from '~/constants'
import { source } from '~/lib/source'

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const urls = source
          .getPages()
          .map((page) => `<url><loc>${SITE_URL}${page.url}</loc></url>`)
          .join('')

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          { headers: { 'Content-Type': 'application/xml' } }
        )
      },
    },
  },
})
