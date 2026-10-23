import { CONNECTION_RESOURCE_ROOT_SYMBOL } from '@tamery/shared/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Skeleton } from '@tamery/ui/components/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'

import { ConnectionResourceLink } from '~/core/connection/connection-resource-link'
import { ResourceLabel } from '~/core/connection/resource-label'
import { rememberOpenedResource } from '~/core/connection/stores'
import type { Connection } from '~/core/connection/sync'

const ROOT_RESOURCE_VALUE =
  CONNECTION_RESOURCE_ROOT_SYMBOL.description ?? 'CONNECTION_RESOURCE_ROOT'

const resourceValue = (
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
) =>
  resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? ROOT_RESOURCE_VALUE : resource

const resourceName = (
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
) => (resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? '' : resource)

const ConnectionResourcesSelect = ({
  connection,
  resources,
  selectedResourceName,
  onSelectedResourceNameChange,
  disabled,
}: {
  connection: Connection
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
  onSelectedResourceNameChange: (resource: string | null) => void
  disabled: boolean
}) => (
  <Select
    value={
      selectedResourceName === null
        ? undefined
        : resourceValue(selectedResourceName)
    }
    onValueChange={(value) => onSelectedResourceNameChange(value ?? null)}
    disabled={disabled}
  >
    <SelectTrigger
      data-mask
      size="xs"
      variant="ghost-faint"
      className="pointer-events-auto"
    >
      <SelectValue>
        {selectedResourceName !== null && (
          <ResourceLabel
            connection={connection}
            name={resourceName(selectedResourceName)}
          />
        )}
      </SelectValue>
    </SelectTrigger>
    <SelectContent data-mask size="xs">
      {resources.map((resource) => (
        <SelectItem
          key={resourceValue(resource)}
          value={resourceValue(resource)}
        >
          <ResourceLabel
            connection={connection}
            name={resourceName(resource)}
          />
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

const ConnectionUrl = ({
  displayUrl,
  openResourceId,
}: {
  displayUrl: string
  openResourceId: string | undefined
}) => (
  <Tooltip>
    <TooltipTrigger
      data-mask
      render={
        openResourceId ? (
          <ConnectionResourceLink
            resourceId={openResourceId}
            preload={false}
            tabIndex={-1}
          />
        ) : (
          <span />
        )
      }
      className="text-muted-foreground pointer-events-auto cursor-default truncate"
    >
      {displayUrl}
    </TooltipTrigger>
    <TooltipContent data-mask>{displayUrl}</TooltipContent>
  </Tooltip>
)

export const ConnectionCardMeta = ({
  canSend,
  connection,
  databaseKnown,
  displayUrl,
  openResourceId,
  resources,
  selectedResourceName,
}: {
  canSend: boolean
  connection: Connection
  /** Off until this device has the server details: the selected database is then only the first one the list stored. */
  databaseKnown: boolean
  displayUrl: string | undefined
  /** The address is a link to it too: its tooltip takes the pointer the row link would otherwise get. */
  openResourceId: string | undefined
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
}) => (
  <div className="text-muted-foreground pointer-events-none relative z-10 flex min-w-0 shrink-0 items-center gap-2 text-xs">
    <div className="hidden max-w-52 min-w-0 items-center font-mono md:flex">
      {displayUrl ? (
        <ConnectionUrl
          displayUrl={displayUrl}
          openResourceId={openResourceId}
        />
      ) : (
        displayUrl === undefined &&
        databaseKnown && <Skeleton className="h-3 w-40" />
      )}
    </div>
    {databaseKnown &&
      (resources.length > 1 ? (
        <ConnectionResourcesSelect
          connection={connection}
          resources={resources}
          selectedResourceName={selectedResourceName}
          onSelectedResourceNameChange={(value) =>
            rememberOpenedResource(connection.id, value)
          }
          disabled={!canSend}
        />
      ) : (
        selectedResourceName !== null && (
          <span data-mask className="max-w-32 shrink-0 truncate text-xs">
            <ResourceLabel
              connection={connection}
              name={resourceName(selectedResourceName)}
              prefix={<span className="text-muted-foreground/50">/ </span>}
            />
          </span>
        )
      ))}
  </div>
)
