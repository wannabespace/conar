import { mainModules } from '~/lib/modules'

import { Demo } from './-components/demo'
import { Hero } from './-components/hero'

export const HomePage = () => (
  <main className="px-4 sm:px-6 lg:px-10">
    <div>
      <Hero className="sticky top-(--navbar-height)" />
      <Demo />
    </div>
    {mainModules.homeSections.map(({ Component }, index) => (
      <Component key={index} />
    ))}
  </main>
)
