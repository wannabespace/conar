import { Button } from '@connnect/ui/components/button'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine } from '@remixicon/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useDatabases } from '~/entities/database'
import { List } from './-components/list'

export const Route = createFileRoute('/(protected)/_dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: connections } = useDatabases()
  const router = useRouter()

  function handleCreateConnection() {
    router.navigate({ to: '/create' })
  }

  useKeyboardEvent(e => e.key === 'n' && e.metaKey, () => {
    router.navigate({ to: '/create' })
  })

  return (
    <div className="w-full mx-auto max-w-2xl py-10">
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
