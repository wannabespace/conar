import {
  Layers01Icon,
  PlusSignIcon,
  SortByDown01Icon,
  SortByUp01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { connectionLabels } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { cn } from '@tamery/ui/lib/utils'
import { caseWhen, eq, useLiveQuery } from '@tanstack/react-db'
import { type } from 'arktype'
import { AnimatePresence } from 'motion/react'
import type { ComponentRef } from 'react'
import { useRef } from 'react'
import { useSubscription } from 'seitu/react'
import { createWebStorageValue } from 'seitu/web'

import { Link } from '~/components/link'
import { useCollections } from '~/core/collections'
import { lastOpenedResourcesStorageValue } from '~/core/connection/last-opened-resources'
import type { Connection } from '~/core/connection/sync'
import { usePermissions } from '~/core/user/permissions'
import { useActiveWorkspace } from '~/core/workspace/hooks'

import { ConnectionCard } from './connection-card'
import { Empty } from './connections-empty'
import { LastOpenedResources } from './last-opened-resources'
import { RemoveConnectionDialog } from './remove-connection-dialog'

const sortOptions = [
  { value: 'date-desc', label: 'Date (newest first)' },
  { value: 'date-asc', label: 'Date (oldest first)' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
] as const

const sortValue = createWebStorageValue({
  type: 'localStorage',
  key: 'connections-list-sort',
  schema: type('string' as type.cast<(typeof sortOptions)[number]['value']>),
  defaultValue: 'date-desc',
})

const groupOptions = [
  { value: 'label', label: 'Group by label' },
  { value: 'type', label: 'Group by type' },
  { value: 'none', label: 'No grouping' },
] as const

const groupValue = createWebStorageValue({
  type: 'localStorage',
  key: 'connections-list-group',
  schema: type('string' as type.cast<(typeof groupOptions)[number]['value']>),
  defaultValue: 'label',
})

export const ConnectionsList = () => {
  const { connectionsCollection } = useCollections()
  const sort = useSubscription(sortValue)
  const grouping = useSubscription(groupValue)
  const { data: activeWorkspace } = useActiveWorkspace()
  const { data } = useLiveQuery({
    query: (q) => {
      let query = activeWorkspace
        ? q
            .from({ c: connectionsCollection })
            .where(({ c }) => eq(c.workspaceId, activeWorkspace.id))
        : q.from({ c: connectionsCollection })

      if (grouping === 'label') {
        query = query.orderBy(
          ({ c }) => caseWhen(eq(c.label, ''), null, c.label),
          {
            nulls: 'last',
          }
        )
      } else if (grouping === 'type') {
        query = query.orderBy(({ c }) => c.type)
      }

      const [sortField, sortDirection] = sort.split('-') as [
        'date' | 'name',
        'asc' | 'desc',
      ]
      return query.orderBy(
        ({ c }) => (sortField === 'date' ? c.createdAt : c.name),
        sortDirection
      )
    },
  })

  const canCreate = usePermissions().check('connection.create', {
    count: data.length,
  })

  const removeDialogRef =
    useRef<ComponentRef<typeof RemoveConnectionDialog>>(null)
  const lastOpenedResources = useSubscription(lastOpenedResourcesStorageValue)

  const groupTitle = (connection: Connection): string | null => {
    if (grouping === 'label') {
      return connection.label || null
    }
    if (grouping === 'type') {
      return connectionLabels[connection.type]
    }
    return null
  }
  const groups: { label: string | null; connections: Connection[] }[] = []
  for (const connection of data) {
    const label = groupTitle(connection)
    const previous = groups.at(-1)
    if (previous && previous.label === label) {
      previous.connections.push(connection)
    } else {
      groups.push({ label, connections: [connection] })
    }
  }
  const showHeaders = groups.some((group) => group.label !== null)

  const showLastOpened = lastOpenedResources.length > 0 && data.length > 1

  return (
    <div className="flex flex-col gap-6">
      <RemoveConnectionDialog ref={removeDialogRef} />
      {showLastOpened && <LastOpenedResources />}
      {data.length > 1 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-2xs text-muted-foreground px-2 font-semibold tracking-wider uppercase">
            {data.length} connection{data.length === 1 ? '' : 's'}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={grouping}
              onValueChange={(value) => {
                if (value) {
                  groupValue.set(value)
                }
              }}
            >
              <SelectTrigger size="sm" className="shrink-0">
                <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} />
                <SelectValue>
                  {groupOptions.find((option) => option.value === grouping)
                    ?.label ?? grouping}
                </SelectValue>
              </SelectTrigger>
              <SelectContent size="sm">
                {groupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) => {
                if (value) {
                  sortValue.set(value)
                }
              }}
            >
              <SelectTrigger size="sm" className="shrink-0">
                <HugeiconsIcon
                  icon={
                    sort.includes('asc') ? SortByUp01Icon : SortByDown01Icon
                  }
                  strokeWidth={2}
                />
                <SelectValue>
                  {sortOptions.find((option) => option.value === sort)?.label ??
                    sort}
                </SelectValue>
              </SelectTrigger>
              <SelectContent size="sm">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              render={<Link to="/create" />}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={2}
                className="text-muted-foreground size-4"
              />
              New
            </Button>
          </div>
        </div>
      )}
      {data.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label ?? '__other__'} className="flex flex-col">
              {showHeaders && (
                <h3 className="text-2xs text-muted-foreground mb-1.5 px-2 font-semibold tracking-wider uppercase">
                  {group.label ?? 'Other'}
                </h3>
              )}
              <div className="bg-card ring-foreground/4 overflow-hidden rounded-xl shadow-xs ring">
                <AnimatePresence initial={false} mode="popLayout">
                  {group.connections.map((connection) => (
                    <ConnectionCard
                      key={connection.id}
                      connection={connection}
                      onRemove={() => {
                        removeDialogRef.current?.remove(connection)
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
          <Link
            to="/create"
            disabled={!canCreate}
            data-guest-locked={canCreate ? undefined : 'connections'}
            className={cn(
              'text-muted-foreground hover:bg-card hover:text-foreground flex h-9 cursor-default items-center justify-center gap-2 rounded-xl border border-dashed text-sm transition-colors duration-150',
              !canCreate && 'opacity-50'
            )}
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-4"
            />
            New connection
          </Link>
        </div>
      ) : (
        <Empty />
      )}
    </div>
  )
}
