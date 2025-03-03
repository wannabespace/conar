import { Tabs, TabsList, TabsTrigger } from '@connnect/ui/components/tabs'
import { createFileRoute, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { columnsInfoQuery, useConnection } from '~/entities/connection'
import { queryClient } from '~/main'
import { useOpenTabs } from './-composables'

export const Route = createFileRoute(
  '/(protected)/_dashboard/connection/$id/tables',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { openTabs, setOpenTabs } = useOpenTabs(id)
  const { data: connection } = useConnection(id)
  const navigate = useNavigate()
  const { table: activeTable } = useParams({ strict: false })

  useEffect(() => {
    openTabs.forEach((tab) => {
      queryClient.prefetchQuery(columnsInfoQuery(connection!, tab.id))
    })
  }, [])

  const handleTabClose = (tableId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== tableId)

    setOpenTabs(newTabs)

    if (newTabs.length === 0) {
      navigate({ to: '/connection/$id', params: { id } })
    }
  }

  function handleTabChange(tableId: string) {
    navigate({ to: `/connection/$id/tables/${tableId}` })
  }

  return (
    <div>
      <Tabs value={activeTable} onValueChange={handleTabChange}>
        <TabsList defaultValue={activeTable} className="flex w-full overflow-x-auto bg-muted/50">
          {openTabs?.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 px-4 py-2 relative group"
            >
              <span>{tab.label}</span>
              <span
                onClick={() => handleTabClose(tab.id)}
                className="block opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Close ${tab.label} tab`}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  )
}
