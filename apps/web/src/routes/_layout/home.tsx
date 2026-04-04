import { createFileRoute } from '@tanstack/react-router'
import { SEO } from '~/constants'
import { seo } from '~/utils/seo'
import { Demo } from './-components/demo'
import { Features } from './-components/features'
import { Hero } from './-components/hero'
import { Pricing } from './-components/pricing'
import { Testimonials } from './-components/testimonials'

// eslint-disable-next-line react-refresh/only-export-components
export const Route = createFileRoute('/_layout/home')({
  component: HomePage,
  head: () => ({
    meta: seo({
      title: `Conar - ${SEO.title}`,
      description: SEO.description,
      image: '/og-image.png',
      url: 'https://conar.app',
    }),
  }),
})

export function HomePage() {
  return (
    <>
      <main className={`
        px-4
        sm:px-6
        lg:px-10
      `}
      >
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
