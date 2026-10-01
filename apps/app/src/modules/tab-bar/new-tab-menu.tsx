import { LayoutTable02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
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

import type { Connection, ConnectionResource } from '~/core/connection/sync'
import { openTab } from '~/core/tabs/actions'
import { tableTabId } from '~/core/tabs/ids'
import { appModules } from '~/lib/modules'

interface TablesAndSchemas {
  schemas: { name: string; tables: { name: string }[] }[]
}

export const NewTabMenu = ({
  connection,
  connectionResource,
  tablesAndSchemas,
}: {
  connection: Connection
  connectionResource: ConnectionResource
  tablesAndSchemas: TablesAndSchemas | undefined
}) => {
  const router = useRouter()
  const schemas = tablesAndSchemas?.schemas ?? []
  const showSchema = schemas.length > 1
  const schemaItems = appModules
    .schemaGroups(connection.type)
    .flatMap((group) => group.items)

  const goToTab = (tabId: string) =>
    router.navigate({
      params: { resourceId: connectionResource.id, tabId },
      to: '/connection/$resourceId/$tabId',
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost-muted" size="icon-xs" aria-label="New tab" />
        }
      >
        <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[70vh] min-w-48 overflow-auto"
      >
        {appModules.newTabActions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => goToTab(action.open(connectionResource.id))}
          >
            <HugeiconsIcon icon={action.icon} strokeWidth={2} />
            {action.label}
          </DropdownMenuItem>
        ))}
        {schemaItems.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Schema</DropdownMenuLabel>
              {schemaItems.map(({ icon, label, tabId }) => (
                <DropdownMenuItem
                  key={tabId}
                  onClick={() => goToTab(openTab(connectionResource.id, tabId))}
                >
                  <HugeiconsIcon icon={icon} strokeWidth={2} />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        {schemas.some((schema) => schema.tables.length > 0) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tables</DropdownMenuLabel>
              {schemas.flatMap((schema) =>
                schema.tables.map((table) => (
                  <DropdownMenuItem
                    key={tableTabId(schema.name, table.name)}
                    onClick={() =>
                      goToTab(
                        openTab(
                          connectionResource.id,
                          tableTabId(schema.name, table.name)
                        )
                      )
                    }
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
