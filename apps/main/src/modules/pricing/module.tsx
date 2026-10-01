import type { MainModule } from '~/lib/module'

import { Pricing } from './pricing'

export default {
  homeSections: [{ Component: Pricing, order: 20 }],
} satisfies MainModule
