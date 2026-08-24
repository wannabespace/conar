import { RiCodeSSlashLine } from '@remixicon/react'
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

import type { functionsType } from '~/entities/connection/queries'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries'

import { DefinitionsEmptyState } from '../-components/empty-state'
import { DefinitionsGrid } from '../-components/grid'
import { DefinitionsHeader } from '../-components/header'
import { SchemaSelect } from '../-components/schema-select'
import { MOTION_BLOCK_PROPS } from '../-constants'
import { useDefinitionsState } from '../-hooks/use-definitions-state'

const functionsRouteApi = getRouteApi('/_protected/connection/$resourceId')

type FunctionType = (typeof functionsType.infer)['type']

const typeFilterOptions: { label: string; value: FunctionType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Function', value: 'function' },
  { label: 'Procedure', value: 'procedure' },
]

export const Functions = () => {
  const { connectionResource } = functionsRouteApi.useRouteContext()
  const { data: functions, isPending } = useQuery(
    resourceFunctionsQueryOptions({ connectionResource })
  )
  const { schemas, selectedSchema, setSelectedSchema, search, setSearch } =
    useDefinitionsState({
      connectionResource,
    })
  const [filterType, setFilterType] =
    useState<(typeof typeFilterOptions)[number]['value']>('all')

  const filteredFunctions =
    functions?.filter(
      (item) =>
        item.schema === selectedSchema &&
        (filterType === 'all' || filterType === item.type) &&
        (!search ||
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.language?.toLowerCase().includes(search.toLowerCase()) ||
          (item.return_type &&
            item.return_type.toLowerCase().includes(search.toLowerCase())))
    ) ?? []

  return (
    <>
      <DefinitionsHeader>Functions</DefinitionsHeader>
      <div className="mb-4 flex items-center gap-2">
        <SearchInput
          placeholder="Search functions"
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
                  ? typeFilterOptions.find((option) => option.value === value)
                      ?.label
                  : 'Filter Type'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {typeFilterOptions.map((option) => (
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
        {filteredFunctions.length === 0 && (
          <DefinitionsEmptyState
            title="No functions found"
            description="This schema doesn't have any functions matching your filter."
          />
        )}

        {filteredFunctions.map((item) => (
          <CardMotion
            key={`${item.schema}-${item.name}-${item.type}`}
            layout
            {...MOTION_BLOCK_PROPS}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2 flex items-center gap-2 text-base">
                    <RiCodeSSlashLine className="text-primary size-4" />
                    <HighlightText text={item.name} match={search} />
                    <Badge variant="secondary">
                      {item.type === 'function' ? 'Function' : 'Procedure'}
                    </Badge>
                  </CardTitle>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    {item.language && (
                      <Badge variant="outline">
                        <HighlightText text={item.language} match={search} />
                      </Badge>
                    )}
                    {item.return_type && (
                      <>
                        <span>returns</span>
                        <Badge variant="outline">
                          <HighlightText
                            text={item.return_type}
                            match={search}
                          />
                        </Badge>
                      </>
                    )}
                    {!!item.argumentCount && (
                      <span>
                        {item.argumentCount}{' '}
                        {item.argumentCount === 1 ? 'arg' : 'args'}
                      </span>
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
