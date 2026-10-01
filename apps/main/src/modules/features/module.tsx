import type { MainModule } from '~/lib/module'

import { Features } from './features'

export default {
  homeSections: [{ Component: Features, order: 0 }],
} satisfies MainModule
