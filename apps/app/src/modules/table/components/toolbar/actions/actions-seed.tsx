import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import { queryOptions, useQuery } from '@tanstack/react-query'

import { queryClient } from '~/lib/query-client'

import { useTableColumnsContext } from '../../../lib/columns'
import { SeedPanelSkeleton } from './seed-panel-skeleton'

// Not lazy + Suspense: a Suspense reveal inside a tab starts the tab's
// AnimateView view transition, whose snapshot paints over the open drawer
const seedPanelQuery = queryOptions({
  gcTime: Number.POSITIVE_INFINITY,
  queryFn: async () => {
    const { SeedPanel } = await import('./seed-panel')

    return SeedPanel
  },
  queryKey: ['seed-panel'],
})

export const preloadSeedPanel = () => queryClient.prefetchQuery(seedPanelQuery)

export const ActionsSeed = ({
  table,
  schema,
  open,
  onOpenChange,
}: {
  table: string
  schema: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { columns } = useTableColumnsContext()
  const { data: SeedPanel } = useQuery({ ...seedPanelQuery, enabled: open })

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      swipeDirection="right"
    >
      <DrawerContent className="sm:[--drawer-content-width:38rem]!">
        <DrawerHeader showCloseButton>
          <DrawerTitle>Seed data</DrawerTitle>
          <DrawerDescription data-mask className="truncate">
            {schema}.{table}
          </DrawerDescription>
        </DrawerHeader>
        {SeedPanel ? (
          <SeedPanel
            schema={schema}
            table={table}
            onOpenChange={onOpenChange}
          />
        ) : (
          <SeedPanelSkeleton columns={columns} />
        )}
      </DrawerContent>
    </Drawer>
  )
}
