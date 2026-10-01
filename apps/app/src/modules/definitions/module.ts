import type { AppModule } from '~/lib/module'

import { definitionsSchemaItems, definitionsTab } from './lib/tab'

export default {
  schemaItems: definitionsSchemaItems,
  tabs: [definitionsTab],
} satisfies AppModule
