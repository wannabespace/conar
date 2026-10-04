import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@tamery/ui/components/drawer'

import { SeedPanel } from './seed-panel'

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
}) => (
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
      <SeedPanel schema={schema} table={table} onOpenChange={onOpenChange} />
    </DrawerContent>
  </Drawer>
)
