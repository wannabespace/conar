import {
  CONNECTION_RESOURCE_ROOT_LABEL,
  CONNECTION_RESOURCE_ROOT_SYMBOL,
} from '@tamery/shared/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Skeleton } from '@tamery/ui/components/skeleton'

import type { getConnectionStore } from '~/entities/connection/store/stores'

const ROOT_RESOURCE_VALUE =
  CONNECTION_RESOURCE_ROOT_SYMBOL.description ?? 'CONNECTION_RESOURCE_ROOT'

const resourceValue = (
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
) =>
  resource === CONNECTION_RESOURCE_ROOT_SYMBOL ? ROOT_RESOURCE_VALUE : resource

const resourceLabel = (
  resource: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL
) =>
  resource === CONNECTION_RESOURCE_ROOT_SYMBOL
    ? CONNECTION_RESOURCE_ROOT_LABEL
    : resource

const ConnectionResourcesSelect = ({
  resources,
  selectedResourceName,
  onSelectedResourceNameChange,
  disabled,
}: {
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
      variant="ghost-row"
      className="pointer-events-auto"
    >
      <SelectValue>
        {selectedResourceName === null
          ? null
          : resourceLabel(selectedResourceName)}
      </SelectValue>
    </SelectTrigger>
    <SelectContent data-mask size="xs">
      {resources.map((resource) => (
        <SelectItem
          key={resourceValue(resource)}
          value={resourceValue(resource)}
        >
          {resourceLabel(resource)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

export const ConnectionCardMeta = ({
  canSend,
  connectionStore,
  displayUrl,
  isResourcesShown,
  resources,
  selectedResourceName,
}: {
  canSend: boolean
  connectionStore: ReturnType<typeof getConnectionStore>
  displayUrl: string | undefined
  isResourcesShown: boolean
  resources: (string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL)[]
  selectedResourceName: string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null
}) => (
  <div className="text-muted-foreground pointer-events-none relative z-10 flex min-w-0 shrink-0 items-center gap-2 text-xs">
    <div className="hidden max-w-52 min-w-0 items-center font-mono md:flex">
      {displayUrl ? (
        <span data-mask className="truncate">
          {displayUrl}
        </span>
      ) : (
        <Skeleton className="h-3 w-40" />
      )}
    </div>
    {isResourcesShown ? (
      <ConnectionResourcesSelect
        resources={resources}
        selectedResourceName={selectedResourceName}
        onSelectedResourceNameChange={(value) =>
          connectionStore.set(
            (state) =>
              ({
                ...state,
                lastOpenedResourceName: value,
              }) satisfies typeof state
          )
        }
        disabled={!canSend}
      />
    ) : (
      selectedResourceName !== null && (
        <span data-mask className="max-w-32 shrink-0 truncate text-xs">
          <span className="text-muted-foreground/50">/ </span>
          {resourceLabel(selectedResourceName)}
        </span>
      )
    )}
  </div>
)
