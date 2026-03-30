import { CONNECTION_TYPES_WITH_TRIGGERS } from '@conar/shared/constants'
import { connectionLabels } from '@conar/shared/enums/connection-type'
import { title } from '@conar/shared/utils/title'
import { Badge } from '@conar/ui/components/badge'
import { CardContent, CardMotion, CardTitle } from '@conar/ui/components/card'
import { HighlightText } from '@conar/ui/components/custom/highlight'
import { SearchInput } from '@conar/ui/components/custom/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { RiFlashlightLine, RiTable2 } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { resourceTablesAndSchemasQueryOptions, resourceTriggersQueryOptions } from '~/entities/connection/queries'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { useRefreshHotkey } from '~/hooks/use-refresh-hotkey'
import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { MOTION_BLOCK_PROPS } from '../-constants'

export const Route = createFileRoute('/_protected/connection/$resourceId/definitions/triggers/')({
  component: DatabaseTriggersPage,
  loader: ({ context }) => ({ connection: context.connection, connectionResource: context.connectionResource }),
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: title('Triggers', loaderData.connection.name, loaderData.connectionResource.name) }] : [],
  }),
})

const eventFilterOptions = [
  { label: 'All Events', value: 'all' },
  { label: 'INSERT', value: 'INSERT' },
  { label: 'UPDATE', value: 'UPDATE' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'TRUNCATE', value: 'TRUNCATE' },
]

const timingFilterOptions = [
  { label: 'All Timings', value: 'all' },
  { label: 'BEFORE', value: 'BEFORE' },
  { label: 'AFTER', value: 'AFTER' },
  { label: 'INSTEAD OF', value: 'INSTEAD OF' },
]

function DatabaseTriggersPage() {
  const { connection, connectionResource } = Route.useRouteContext()
  const { data: triggers, refetch, isFetching, isPending, dataUpdatedAt } = useQuery(resourceTriggersQueryOptions({ connectionResource }))
  const store = getConnectionResourceStore(connectionResource.id)
  const showSystem = useSubscription(store, { selector: state => state.showSystem })
  const { data } = useQuery(resourceTablesAndSchemasQueryOptions({ silent: false, connectionResource, showSystem }))
  const schemas = data?.schemas.map(({ name }) => name) ?? []
  const [selectedSchema, setSelectedSchema] = useState(schemas[0])
  const [search, setSearch] = useState('')
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterTiming, setFilterTiming] = useState('all')

  if (schemas.length > 0 && (!selectedSchema || !schemas.includes(selectedSchema)))
    setSelectedSchema(schemas[0])

  useRefreshHotkey(refetch, isFetching)

  if (!CONNECTION_TYPES_WITH_TRIGGERS.includes(connection.type)) {
    return (
      <>
        <DefinitionsHeader
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
          dataUpdatedAt={dataUpdatedAt}
        >
          Triggers
        </DefinitionsHeader>
        <DefinitionsGrid loading={false}>
          <DefinitionsEmptyState
            title="Triggers not supported"
            description={`${connectionLabels[connection.type]} does not support database triggers.`}
          />
        </DefinitionsGrid>
      </>
    )
  }

  const filteredTriggers = triggers?.filter(item =>
    item.schema === selectedSchema
    && (filterEvent === 'all' || item.event.includes(filterEvent))
    && (filterTiming === 'all' || filterTiming === item.timing)
    && (!search
      || item.name.toLowerCase().includes(search.toLowerCase())
      || item.table.toLowerCase().includes(search.toLowerCase())
      || (item.function_name && item.function_name.toLowerCase().includes(search.toLowerCase()))
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
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
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
        {schemas.length > 1 && (
          <Select
            value={selectedSchema}
            onValueChange={(v) => {
              if (v) {
                setSelectedSchema(v)
              }
            }}
          >
            <SelectTrigger className="max-w-56 min-w-[180px]">
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                <span className="shrink-0 text-muted-foreground">schema</span>
                <span className="truncate"><SelectValue /></span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {schemas.map(schema => (
                <SelectItem key={schema} value={schema}>{schema}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
                    {item.function_name && (
                      <>
                        <span>calls</span>
                        <Badge variant="outline">
                          <HighlightText text={item.function_name} match={search} />
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
