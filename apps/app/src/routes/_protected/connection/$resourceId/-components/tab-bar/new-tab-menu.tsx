import {
  LayoutTable02Icon,
  PlayIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button } from '@tamery/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import { useRouter } from '@tanstack/react-router'

import type {
  Connection,
  ConnectionResource,
} from '~/entities/connection/core/sync'
import { openTableTab } from '~/entities/connection/store/helpers/tabs'
import { tableTabId } from '~/entities/connection/store/tabs/ids'

import { schemaGroups } from '../navigator/definitions-section'

interface TablesAndSchemas {
  schemas: { name: string; tables: { name: string }[] }[]
}

export const NewTabMenu = ({
  connection,
  connectionResource,
  tablesAndSchemas,
  onNewQuery,
}: {
  connection: Connection
  connectionResource: ConnectionResource
  tablesAndSchemas: TablesAndSchemas | undefined
  onNewQuery: VoidFunction
}) => {
  const router = useRouter()
  const schemas = tablesAndSchemas?.schemas ?? []
  const showSchema = schemas.length > 1

  const goToTab = (tabId: string) =>
    router.navigate({
      to: '/connection/$resourceId/$tabId',
      params: { resourceId: connectionResource.id, tabId },
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            size="icon-xs"
            aria-label="New tab"
          />
        }
      >
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[70vh] min-w-48 overflow-auto"
      >
        <DropdownMenuItem onClick={onNewQuery}>
          <HugeiconsIcon icon={PlayIcon} strokeWidth={2} />
          New query
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Schema</DropdownMenuLabel>
          {schemaGroups(connection)
            .flatMap((group) => group.items)
            .map(({ Icon, label, open, tabId }) => (
              <DropdownMenuItem
                key={tabId}
                onClick={() => {
                  open(connectionResource.id, false)
                  goToTab(tabId)
                }}
              >
                <HugeiconsIcon icon={Icon} strokeWidth={2} />
                {label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuGroup>
        {schemas.some((schema) => schema.tables.length > 0) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tables</DropdownMenuLabel>
              {schemas.flatMap((schema) =>
                schema.tables.map((table) => (
                  <DropdownMenuItem
                    key={tableTabId(schema.name, table.name)}
                    onClick={() => {
                      openTableTab(
                        connectionResource.id,
                        schema.name,
                        table.name
                      )
                      goToTab(tableTabId(schema.name, table.name))
                    }}
                  >
                    <HugeiconsIcon icon={LayoutTable02Icon} strokeWidth={2} />
                    <span data-mask className="truncate">
                      {showSchema ? `${schema.name}.${table.name}` : table.name}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
