import {
  RiFileList3Line,
  RiKey2Line,
  RiLayoutColumnLine,
  RiTable2,
} from '@remixicon/react'
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

import type { indexesType } from '~/entities/connection/queries'
import { resourceIndexesQueryOptions } from '~/entities/connection/queries'

import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

type IndexItem = typeof indexesType.infer

interface GroupedIndex extends Pick<
  IndexItem,
  'schema' | 'table' | 'type' | 'name' | 'isUnique' | 'isPrimary'
> {
  columns: string[]
  customExpressions: string[]
}

type IndexType = 'primary' | 'unique' | 'regular'

const filterOptions: { label: string; value: IndexType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Primary Key', value: 'primary' },
  { label: 'Unique Index', value: 'unique' },
  { label: 'Regular Index', value: 'regular' },
]

const groupIndexes = (
  indexes: IndexItem[] | undefined,
  selectedSchema: string | undefined,
  filterType: (typeof filterOptions)[number]['value'],
  search: string
): Record<string, GroupedIndex> => {
  const grouped: Record<string, GroupedIndex> = {}

  for (const indexItem of indexes ?? []) {
    if (indexItem.schema !== selectedSchema) {
      continue
    }

    const matchesFilter =
      filterType === 'all' ||
      filterOptions.find((option) => option.value === filterType)?.value ===
        indexItem.type

    if (!matchesFilter) {
      continue
    }

    const matchesSearch =
      !search ||
      indexItem.name.toLowerCase().includes(search.toLowerCase()) ||
      indexItem.table.toLowerCase().includes(search.toLowerCase()) ||
      indexItem.column?.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) {
      continue
    }

    const key = `${indexItem.schema}-${indexItem.table}-${indexItem.name}`
    const existing = grouped[key]

    if (existing) {
      if (indexItem.column && !existing.columns.includes(indexItem.column)) {
        existing.columns.push(indexItem.column)
      }
      if (
        indexItem.customExpression &&
        !existing.customExpressions.includes(indexItem.customExpression)
      ) {
        existing.customExpressions.push(indexItem.customExpression)
      }
    } else {
      grouped[key] = {
        ...indexItem,
        columns: indexItem.column ? [indexItem.column] : [],
        customExpressions: indexItem.customExpression
          ? [indexItem.customExpression]
          : [],
      }
    }
  }

  return grouped
}

const routeApi = getRouteApi('/_protected/connection/$resourceId')

export const Indexes = () => {
  const { connectionResource } = routeApi.useRouteContext()
  const { data: indexes, isPending } = useQuery(
    resourceIndexesQueryOptions({ connectionResource })
  )
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } =
    useDefinitionsState({
      connectionResource,
    })
  const [filterType, setFilterType] =
    useState<(typeof filterOptions)[number]['value']>('all')

  const groupedIndexes = groupIndexes(
    indexes,
    selectedSchema,
    filterType,
    search
  )
  const indexList = Object.values(groupedIndexes)

  return (
    <>
      <DefinitionsHeader>Indexes</DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search indexes"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <Select
          value={filterType}
          onValueChange={(v) => {
            if (v) {
              setFilterType(v)
            }
          }}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Filter Type">
              {(value) =>
                value
                  ? filterOptions.find((option) => option.value === value)
                      ?.label
                  : 'Filter Type'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
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
        {indexList.length === 0 && (
          <DefinitionsEmptyState
            title="No indexes found"
            description="This schema doesn't have any indexes matching your filter."
          />
        )}

        {indexList.map((item) => (
          <CardMotion
            key={`${item.schema}-${item.table}-${item.name}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    {item.isPrimary ? (
                      <RiKey2Line className="text-primary size-4" />
                    ) : (
                      <RiFileList3Line className="text-primary size-4" />
                    )}
                    <HighlightText text={item.name} match={search} />
                    {item.isPrimary && (
                      <Badge variant="secondary">Primary Key</Badge>
                    )}
                    {item.isUnique && !item.isPrimary && (
                      <Badge variant="secondary">Unique</Badge>
                    )}
                  </CardTitle>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Badge variant="outline">
                      <RiTable2 className="size-3" />
                      <HighlightText text={item.table} match={search} />
                    </Badge>
                    {(item.columns.length > 0 ||
                      item.customExpressions.length > 0) && (
                      <>
                        <span>on</span>
                        {[...item.columns, ...item.customExpressions].map(
                          (col) => (
                            <Badge key={col} variant="outline">
                              <RiLayoutColumnLine className="size-3" />
                              <HighlightText text={col} match={search} />
                            </Badge>
                          )
                        )}
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
