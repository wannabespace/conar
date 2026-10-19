import { loader } from 'fumadocs-core/source'

import { docs } from './collections'

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  url: (slugs) => (slugs.length === 0 ? '/' : `/${slugs.join('/')}`),
})
