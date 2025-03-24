import { Button } from '@connnect/ui/components/button'
import { DotPattern } from '@connnect/ui/components/magicui/dot-pattern'
import { useKeyboardEvent } from '@react-hookz/web'
import { RiAddLine } from '@remixicon/react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useDatabases } from '~/entities/database'
import { DatabasesList } from './-components/databases-list'
import { Profile } from './-components/profile'

export const Route = createFileRoute('/(protected)/_protected/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data: databases } = useDatabases()
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
        className="absolute z-0 top-0 left-0 [mask-image:linear-gradient(to_bottom_left,white,transparent,transparent)]"
      />
      <h1 className="scroll-m-20 mb-6 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Dashboard
        {' '}
      </h1>
      <Profile className="mb-8" />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl lg:text-4xl font-bold">
          Connections
        </h2>
        <div className="flex items-center gap-2">
          {!!databases?.length && (
            <Button onClick={handleCreateConnection}>
              <RiAddLine className="size-4" />
              Add new
            </Button>
          )}
        </div>
      </div>
      <DatabasesList />
    </div>
  )
}
