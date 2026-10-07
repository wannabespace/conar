import { PlusSignIcon, Settings02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'

import { appModules } from '~/lib/modules'
import { pressNavProps } from '~/lib/press-nav'

import { CreateSchemaDialog } from './create-schema-dialog'
import { CreateTableDialog, createTableDialogRef } from './create-table-dialog'
import { CreateViewDialog } from './create-view-dialog'
import { DefinitionsPanel } from './definitions-section'
import { NavigatorSwitcher } from './navigator-switcher'
import { getNavigatorStore } from './stores'
import { TablesList } from './tables-list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const NavigatorFooter = () => {
  const { connectionResource } = useRouteContext()
  const router = useRouter()

  return (
    <div className="flex shrink-0 flex-col gap-0.5 pt-1.5 pb-0.5 pl-2">
      {appModules.newTabActions.map((action) => (
        <Button
          key={action.label}
          variant="ghost-row"
          size="sm"
          // oxlint-disable-next-line shadcn/no-restyle -- navigator footer rows match the list rows above
          className="h-7 w-full justify-start gap-2 rounded-md px-2"
          {...pressNavProps(() =>
            router.navigate({
              params: {
                resourceId: connectionResource.id,
                tabId: action.open(connectionResource.id),
              },
              to: '/connection/$resourceId/$tabId',
            })
          )}
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
          {action.label}
        </Button>
      ))}
      <Button
        variant="ghost-row"
        size="sm"
        disabled
        // oxlint-disable-next-line shadcn/no-restyle -- navigator footer rows match the list rows above
        className="h-7 w-full justify-start gap-2 rounded-md px-2"
      >
        <HugeiconsIcon
          icon={Settings02Icon}
          strokeWidth={2}
          className="text-muted-foreground size-4 shrink-0"
        />
        Settings
      </Button>
    </div>
  )
}

const createTable = (schema?: string) =>
  createTableDialogRef.current?.create(schema)

export const Navigator = () => {
  const { connectionResource } = useRouteContext()
  const { tabId } = useParams({ strict: false })
  const navigator = useSubscription(
    getNavigatorStore(connectionResource.id, tabId)
  )

  return (
    <div className="text-foreground flex h-full flex-col pr-1.5">
      <div className="shrink-0 pt-0.5 pb-1.5 pl-2">
        <NavigatorSwitcher />
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={navigator}
            initial={{ opacity: 0, x: navigator === 'tables' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: navigator === 'tables' ? 12 : -12 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {navigator === 'tables' ? (
              <TablesList
                className="min-h-0 flex-1"
                onCreateTable={createTable}
              />
            ) : (
              <DefinitionsPanel />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <NavigatorFooter />
      <CreateTableDialog />
      <CreateSchemaDialog />
      <CreateViewDialog />
    </div>
  )
}
