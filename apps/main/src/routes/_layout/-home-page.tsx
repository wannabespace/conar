import { Features } from '~/modules/features/module'
import { Pricing } from '~/modules/pricing/module'
import { Testimonials } from '~/modules/testimonials/module'

import { Demo } from './-components/demo'
import { Hero } from './-components/hero'

export const HomePage = () => (
  <main className="px-4 sm:px-6 lg:px-10">
    <div>
      <Hero className="sticky top-(--navbar-height)" />
      <Demo />
    </div>
    <Features />
    <Testimonials />
    <Pricing />
  </main>
)
