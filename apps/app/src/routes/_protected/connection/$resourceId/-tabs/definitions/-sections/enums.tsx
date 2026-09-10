import {
  LeftToRightListBulletIcon,
  LeftToRightListDashIcon,
} from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Badge } from '@tamery/ui/components/badge'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { TableCell, TableRow } from '@tamery/ui/components/table'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums'

import {
  DefinitionsHeader,
  DefinitionsList,
  DefinitionsToolbar,
  MutedCell,
  NameCell,
} from '../-components/page'
import { SchemaSelect } from '../-components/schema-select'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { matchesSearch } from '../-lib/search'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export const Enums = () => {
  const { connection, connectionResource } = useRouteContext()
  const { data: enums = [], isPending } = useQuery(
    resourceEnumsQueryOptions({ connectionResource })
  )
  const { schemas, search, selectedSchema, setSearch, setSelectedSchema } =
    useDefinitionsState({ connectionResource })
  const columnBound = enums.some((item) => item.metadata?.table)
  const withSets = connection.type === ConnectionType.MySQL

  const inSchema = enums.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter((item) =>
    matchesSearch(
      search,
      item.name,
      item.metadata?.table,
      item.metadata?.column,
      ...item.values
    )
  )

  return (
    <>
      <DefinitionsHeader
        title={withSets ? 'Enums & Sets' : 'Enums'}
        count={isPending ? undefined : rows.length}
        noun="enum"
      />
      <DefinitionsToolbar
        placeholder="Search enums"
        search={search}
        onSearchChange={setSearch}
      >
        <SchemaSelect
          schemas={schemas}
          selectedSchema={selectedSchema}
          setSelectedSchema={setSelectedSchema}
        />
      </DefinitionsToolbar>
      <DefinitionsList
        icon={LeftToRightListBulletIcon}
        columns={
          columnBound
            ? ['Name', 'Table', 'Column', 'Values', 'Type']
            : ['Name', 'Values']
        }
        count={rows.length}
        loading={isPending}
        emptyTitle={inSchema.length === 0 ? 'No enums' : 'No matches'}
        emptyDescription={
          inSchema.length === 0
            ? 'This schema has no enums.'
            : 'No enums match the current search.'
        }
      >
        {rows.map((item) => (
          <TableRow
            key={`${item.name}.${item.metadata?.table ?? ''}.${item.metadata?.column ?? ''}`}
          >
            <NameCell
              icon={
                item.metadata?.isSet
                  ? LeftToRightListDashIcon
                  : LeftToRightListBulletIcon
              }
            >
              <HighlightText text={item.name} match={search} />
            </NameCell>
            {columnBound && (
              <>
                <TableCell data-mask>
                  {item.metadata?.table && (
                    <HighlightText text={item.metadata.table} match={search} />
                  )}
                </TableCell>
                <TableCell
                  data-mask
                  className="font-mono text-xs whitespace-normal"
                >
                  {item.metadata?.column && (
                    <HighlightText text={item.metadata.column} match={search} />
                  )}
                </TableCell>
              </>
            )}
            <TableCell data-mask className="whitespace-normal">
              <span className="flex flex-wrap gap-1">
                {item.values.map((value) => (
                  <Badge key={value} variant="secondary" className="font-mono">
                    <HighlightText text={value} match={search} />
                  </Badge>
                ))}
              </span>
            </TableCell>
            {columnBound && (
              <MutedCell>{item.metadata?.isSet ? 'Set' : 'Enum'}</MutedCell>
            )}
          </TableRow>
        ))}
      </DefinitionsList>
    </>
  )
}
