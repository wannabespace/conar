import { FlashIcon, GridTableIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { CardContent, CardTitle } from '@tamery/ui/components/card'
import { CardMotion } from '@tamery/ui/components/card.motion'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { SearchInput } from '@tamery/ui/components/custom/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'

import { resourceTriggersQueryOptions } from '~/entities/connection/queries'

import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

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

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const Triggers = () => {
  const { connectionResource } = useRouteContext()
  const { data: triggers, isPending } = useQuery(
    resourceTriggersQueryOptions({ connectionResource })
  )
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } =
    useDefinitionsState({
      connectionResource,
    })
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterTiming, setFilterTiming] = useState('all')

  const filteredTriggers =
    triggers?.filter(
      (item) =>
        item.schema === selectedSchema &&
        (filterEvent === 'all' || item.event.includes(filterEvent)) &&
        (filterTiming === 'all' || filterTiming === item.timing) &&
        (!search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.table.toLowerCase().includes(search.toLowerCase()) ||
          item.functionName?.toLowerCase().includes(search.toLowerCase()))
    ) ?? []

  return (
    <>
      <DefinitionsHeader>Triggers</DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search triggers"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
              {(value) =>
                value
                  ? eventFilterOptions.find((option) => option.value === value)
                      ?.label
                  : 'Filter Event'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {eventFilterOptions.map((option) => (
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
              {(value) =>
                value
                  ? timingFilterOptions.find((option) => option.value === value)
                      ?.label
                  : 'Filter Timing'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {timingFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </div>
      <DefinitionsGrid loading={isPending}>
        {filteredTriggers.length === 0 && (
          <DefinitionsEmptyState
            title="No triggers found"
            description="This schema doesn't have any triggers matching your filter."
          />
        )}

        {filteredTriggers.map((item) => (
          <CardMotion
            key={`${item.schema}-${item.table}-${item.name}-${item.event}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    <HugeiconsIcon
                      icon={FlashIcon}
                      strokeWidth={2}
                      className="text-primary size-4"
                    />
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">{item.timing}</Badge>
                    <Badge variant="secondary">{item.event}</Badge>
                    {!item.enabled && (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </CardTitle>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Badge variant="outline">
                      <HugeiconsIcon
                        icon={GridTableIcon}
                        strokeWidth={2}
                        className="size-3"
                      />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {item.functionName && (
                      <>
                        <span>calls</span>
                        <Badge variant="outline">
                          <HighlightText
                            text={item.functionName}
                            match={search}
                          />
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
