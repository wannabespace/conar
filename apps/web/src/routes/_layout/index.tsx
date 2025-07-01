import { createFileRoute } from '@tanstack/react-router'
import { Demo } from './-components/demo'
import { Features } from './-components/features'
import { Hero } from './-components/hero'
import { Pricing } from './-components/pricing'
import { Testimonials } from './-components/testimonials'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <main className="px-4 sm:px-6 lg:px-10">
        <div>
          <Hero className="sticky top-(--navbar-height)" />
          <Demo />
        </div>
        <Features />
        <Testimonials />
        <Pricing />
      </main>
    </>
  )
}
