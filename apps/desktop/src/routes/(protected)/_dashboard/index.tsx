import { Button } from '@connnect/ui/components/button'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine } from '@remixicon/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useConnections } from '~/entities/connection'
import { List } from './-components/list'

export const Route = createFileRoute('/(protected)/_dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: connections } = useConnections()
  const router = useRouter()

  function handleCreateConnection() {
    router.navigate({ to: '/create' })
  }

  useKeyboardEvent(e => e.key === 'n' && e.metaKey, () => {
    router.navigate({ to: '/create' })
  })

  return (
    <div className="w-full mx-auto max-w-2xl py-10">
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className="absolute -z-10 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <div className="flex items-center justify-between mb-10">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Connections
          {' '}
        </h1>
        <div className="flex items-center gap-2">
          {!!connections?.length && (
            <Button onClick={handleCreateConnection}>
              <RiAddLine className="size-4" />
              Add new
            </Button>
          )}
        </div>
      </div>
      <List />
    </div>
  )
}
