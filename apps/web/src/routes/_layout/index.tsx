import { createFileRoute } from '@tanstack/react-router'
import { Conar } from './-components/conar'
import { Hero } from './-components/hero'
import { Video } from './-components/video'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
})

function HomePage() {
  return (
    <>
      <Hero />
      <Video />
      <Conar />
    </>
  )
}
