import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardTitle } from '@conar/ui/components/card'
import { CardMotion } from '@conar/ui/components/card.motion'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiFlashlightLine, RiTable2 } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions/triggers/')({
  component: DatabaseTriggersPage,
  loader: ({ context }) => ({ connection: context.connection, connectionResource: context.connectionResource }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Triggers', loaderData.connection.name, loaderData.connectionResource.name) }] : [],
  }),
})

const eventFilterOptions = [
  { label: 'All Events', value: 'all' },
  { label: 'Insert', value: 'INSERT' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Truncate', value: 'TRUNCATE' },
]

const timingFilterOptions = [
  { label: 'All Timings', value: 'all' },
  { label: 'Before', value: 'BEFORE' },
  { label: 'After', value: 'AFTER' },
  { label: 'Instead Of', value: 'INSTEAD OF' },
]

// eslint-disable-next-line react-refresh/only-export-components
function DatabaseTriggersPage() {
  const { connectionResource } = Route.useRouteContext()
  const { data: triggers, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourceTriggersQueryOptions({ connectionResource }))
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } = useDefinitionsState({ connectionResource })
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterTiming, setFilterTiming] = useState('all')

  useRefreshHotkey(refetch, isFetching)

  const filteredTriggers = triggers?.filter(item =>
    item.schema === selectedSchema
    && (filterEvent === 'all' || item.event.includes(filterEvent))
    && (filterTiming === 'all' || filterTiming === item.timing)
    && (!search
      || item.name.toLowerCase().includes(search.toLowerCase())
      || item.table.toLowerCase().includes(search.toLowerCase())
      || item.functionName?.toLowerCase().includes(search.toLowerCase())
    ),
  ) ?? []

  return (
    <>
      <DefinitionsHeader
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      >
        Triggers
      </DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search triggers"
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          value={filterEvent}
          onValueChange={(v) => {
            if (v) {
              setFilterEvent(v)
            }
          }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Filter Event">
              {value => value ? eventFilterOptions.find(option => option.value === value)?.label : 'Filter Event'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {eventFilterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterTiming}
          onValueChange={(v) => {
            if (v) {
              setFilterTiming(v)
            }
          }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Filter Timing">
              {value => value ? timingFilterOptions.find(option => option.value === value)?.label : 'Filter Timing'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timingFilterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SchemaSelect schemas={schemas} selectedSchema={selectedSchema} setSelectedSchema={setSelectedSchema} />
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredTriggers.length === 0 && (
          <DefinitionsEmptyState
            title="No triggers found"
            description="This schema doesn't have any triggers matching your filter."
          />
        )}

        {filteredTriggers.map(item => (
          <CardMotion
            key={`${item.schema}-${item.table}-${item.name}-${item.event}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    <RiFlashlightLine className="size-4 text-primary" />
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">{item.timing}</Badge>
                    <Badge variant="secondary">{item.event}</Badge>
                    {!item.enabled && <Badge variant="destructive">Disabled</Badge>}
                  </CardTitle>
                  <div className="
                    flex items-center gap-1.5 text-sm text-muted-foreground
                  "
                  >
                    <Badge variant="outline">
                      <RiTable2 className="size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {item.functionName && (
                      <>
                        <span>calls</span>
                        <Badge variant="outline">
                          <HighlightText text={item.functionName} match={search} />
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CardMotion>
        ))}
      </DefinitionsGrid>
    </>
  )
}
