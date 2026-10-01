import type { MainModule } from '~/lib/module'

import { Testimonials } from './testimonials'

export default {
  homeSections: [{ Component: Testimonials, order: 10 }],
} satisfies MainModule
