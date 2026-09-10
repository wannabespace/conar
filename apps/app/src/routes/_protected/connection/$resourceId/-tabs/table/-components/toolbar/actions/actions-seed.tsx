import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import { lazy, Suspense } from 'react'

import { useTableColumnsContext } from '../../../-lib/columns'
import { SeedPanelSkeleton } from './seed-panel-skeleton'

// The panel bundles faker and every generator, so only the shell is eager: the
// drawer paints on the click and the inspector stands in as skeleton meanwhile
export const importSeedPanel = () => import('./seed-panel')

const SeedPanel = lazy(async () => {
  const { SeedPanel: component } = await importSeedPanel()

  return { default: component }
})

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

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      swipeDirection="right"
    >
      <DrawerContent className="sm:[--drawer-content-width:38rem]!">
        <DrawerHeader>
          <DrawerTitle>Seed data</DrawerTitle>
          <DrawerDescription data-mask className="truncate">
            {schema}.{table}
          </DrawerDescription>
        </DrawerHeader>
        <Suspense fallback={<SeedPanelSkeleton columns={columns} />}>
          <SeedPanel
            schema={schema}
            table={table}
            onOpenChange={onOpenChange}
          />
        </Suspense>
      </DrawerContent>
    </Drawer>
  )
}
