import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'
import { lazy, Suspense } from 'react'

import { useTableColumnsContext } from '../../../lib/columns'
import type { SeedPanel as SeedPanelComponent } from './seed-panel'
import { SeedPanelSkeleton } from './seed-panel-skeleton'

// The panel bundles faker and every generator, so only the shell is eager: the
// drawer paints on the click and the inspector stands in as skeleton meanwhile
let loadedSeedPanel: typeof SeedPanelComponent | undefined

export const importSeedPanel = async () => {
  const { SeedPanel } = await import('./seed-panel')
  loadedSeedPanel = SeedPanel
  return { default: SeedPanel }
}

const LazySeedPanel = lazy(importSeedPanel)

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
  // The compiler would cache the first render's pick, before the preload lands
  'use no memo'

  const { columns } = useTableColumnsContext()
  // lazy() suspends on first render even when preloaded, and React then holds
  // the skeleton 300ms, swapping it in mid-slide
  const SeedPanel = loadedSeedPanel ?? LazySeedPanel

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
