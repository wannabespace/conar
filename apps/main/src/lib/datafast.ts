import type { initDataFast } from 'datafast'

import { SITE_URL } from '~/utils/seo'

const WEBSITE_ID = 'dfid_vIscqqXu4BxAFu9ObaBYl'

let client: ReturnType<typeof initDataFast> | null = null

/**
 * Lazily initializes the DataFast analytics client. Browser only — the SDK reads
 * `window`/`document`, so it must never be imported during SSR. Tracking is a no-op
 * on localhost, in iframes and for bots, which the SDK handles on its own.
 */
export function datafast() {
  client ??= import('datafast').then(({ initDataFast }) =>
    initDataFast({
      websiteId: WEBSITE_ID,
      domain: new URL(SITE_URL).hostname,
      // Captures the initial pageview plus every TanStack Router navigation
      autoCapturePageviews: true,
    }),
  )

  return client
}
