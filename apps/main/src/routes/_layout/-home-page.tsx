import { Features } from '~/modules/features/features'
import { Pricing } from '~/modules/pricing/pricing'

import { Agents } from './-components/agents'
import { Engines } from './-components/engines'
import { Faq } from './-components/faq'
import { GetStarted } from './-components/get-started'
import { Hero } from './-components/hero'

export const HomePage = () => (
  <main>
    <Hero />
    <Engines />
    <Features />
    <Agents />
    <Pricing />
    <Faq />
    <GetStarted />
  </main>
)
