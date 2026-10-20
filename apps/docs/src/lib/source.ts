import { loader } from 'fumadocs-core/source'
import type { InferPageType } from 'fumadocs-core/source'

import { docs } from './collections'

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
})

export type DocsPage = InferPageType<typeof source>
