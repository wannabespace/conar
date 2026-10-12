import { Features } from '~/modules/features/features'
import { Pricing } from '~/modules/pricing/pricing'

import { Agents } from './-components/agents'
import { Engines } from './-components/engines'
import { Faq } from './-components/faq'
import { GetStarted } from './-components/get-started'
import { Hero } from './-components/hero'
import { Users } from './-components/users'

export const HomePage = () => (
  <main>
    <Hero />
    <Engines />
    <Features />
    <Agents />
    <Users />
    <Pricing />
    <Faq />
    <GetStarted />
  </main>
)
