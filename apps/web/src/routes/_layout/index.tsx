import { createFileRoute } from '@tanstack/react-router'
import { Demo } from './-components/demo'
import { Features } from './-components/features'
import { Hero } from './-components/hero'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <main className="px-10">
        <div>
          <Hero className="sticky top-(--navbar-height)" />
          <Demo />
        </div>
        <Features />
        <div className="py-30 px-20 flex justify-between items-center gap-2 bg-background rounded-3xl">
          <div className="text-2xl font-medium">
            <h2>
              <span className="text-primary">
                Conar
              </span>
            </h2>
          </div>
        </div>
      </main>
    </>
  )
}
