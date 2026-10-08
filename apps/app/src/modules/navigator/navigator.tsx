import { PlusSignIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshButton } from '@tamery/ui/components/custom/refresh-button'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import { SidebarMenuButton } from '@tamery/ui/components/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, useParams, useRouter } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useSubscription } from 'seitu/react'

import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { QueryLoggerToggle } from '~/modules/query-logger/query-logger-toggle'
import { newQueryAction } from '~/modules/runner/lib/new-query'
import { pressNavProps } from '~/utils/press-nav'

import { CreateSchemaDialog } from './create-schema-dialog'
import { CreateTableDialog, createTableDialogRef } from './create-table-dialog'
import { CreateViewDialog } from './create-view-dialog'
import { DefinitionsPanel } from './definitions-section'
import { NavigatorSwitcher } from './navigator-switcher'
import { getNavigatorStore, navigatorStore } from './stores'
import { TablesList } from './tables-list'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const TablesPanel = ({
  onCreateTable,
}: {
  onCreateTable: (schema?: string) => void
}) => {
  const { connectionResource } = useRouteContext()
  const store = navigatorStore(connectionResource.id)
  const search = useSubscription(store, {
    selector: (state) => state.tablesSearch,
  })
  const setSearch = (tablesSearch: string) =>
    store.set((state) => ({ ...state, tablesSearch }) satisfies typeof state)
  const {
    refetch: refetchTablesAndSchemas,
    isFetching: isRefreshingTablesAndSchemas,
    dataUpdatedAt,
  } = useQuery(resourceTablesAndSchemasQueryOptions({ connectionResource }))

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 pb-1.5 pl-2">
        <SearchInput
          className="flex-1"
          size="sm"
          data-mask
          placeholder="Search"
          aria-label="Search tables"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          start={
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="text-muted-foreground/70 size-3.5"
            />
          }
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <RefreshButton
                variant="outline-muted"
                size="icon-sm"
                onClick={() => refetchTablesAndSchemas()}
                refreshing={isRefreshingTablesAndSchemas}
              />
            }
          />
          <TooltipContent side="bottom">
            <div className="flex flex-col gap-0.5">
              <span>Refresh tables and schemas</span>
              <span className="opacity-70">
                Last updated:{' '}
                {dataUpdatedAt
                  ? new Date(dataUpdatedAt).toLocaleTimeString()
                  : 'never'}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
      <TablesList
        className="min-h-0 flex-1"
        search={search}
        onCreateTable={onCreateTable}
      />
    </>
  )
}

const NavigatorFooter = () => {
  const { connectionResource } = useRouteContext()
  const router = useRouter()

  return (
    <div className="flex shrink-0 flex-col gap-0.5 pt-1.5 pb-0.5 pl-2">
      <SidebarMenuButton
        {...pressNavProps(() =>
          router.navigate({
            params: {
              resourceId: connectionResource.id,
              tabId: newQueryAction.open(connectionResource.id),
            },
            to: '/connection/$resourceId/$tabId',
          })
        )}
      >
        <HugeiconsIcon
          icon={PlusSignIcon}
          strokeWidth={2}
          className="text-muted-foreground"
        />
        {newQueryAction.label}
      </SidebarMenuButton>
      <QueryLoggerToggle />
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
              <TablesPanel onCreateTable={createTable} />
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
