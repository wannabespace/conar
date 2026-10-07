import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { defaultSchemaOf } from '~/core/catalog/capabilities'
import { resourceConstraintsQueryOptions } from '~/core/queries/constraints/list'
import {
  columnDefinitionOf,
  resourceColumnsQueryOptions,
} from '~/core/queries/tables/columns'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

export interface ColumnReference {
  column: string
  schema: string
  table: string
}

export interface ReferenceTarget extends ColumnReference {
  label: string
  type: string
}

export const useReferenceTargets = (enabled: boolean) => {
  const { connection, connectionResource } = useRouteContext()
  const { data: constraints = [], isLoading: constraintsLoading } = useQuery({
    ...resourceConstraintsQueryOptions({ connectionResource }),
    enabled,
    throwOnError: false,
  })
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    ...resourceColumnsQueryOptions({ connectionResource }),
    enabled,
    throwOnError: false,
  })
  const defaultSchema = defaultSchemaOf(
    connection.type,
    connectionResource.name
  )
  const typeOf = new Map(
    columns.map((column) => [
      `${column.schema}.${column.table}.${column.id}`,
      columnDefinitionOf(column).type,
    ])
  )
  const keys = Map.groupBy(
    constraints.filter(
      (constraint) =>
        constraint.type === 'primaryKey' || constraint.type === 'unique'
    ),
    (constraint) =>
      `${constraint.schema}.${constraint.table}.${constraint.name}`
  )
  const targets = new Map<string, ReferenceTarget>()

  for (const [key, ...rest] of keys.values()) {
    const type =
      key?.column && typeOf.get(`${key.schema}.${key.table}.${key.column}`)
    if (key?.column && type && rest.length === 0) {
      const name = `${key.table}.${key.column}`
      const label =
        key.schema === defaultSchema ? name : `${key.schema}.${name}`
      targets.set(label, {
        column: key.column,
        label,
        schema: key.schema,
        table: key.table,
        type,
      })
    }
  }

  return { loading: constraintsLoading || columnsLoading, targets }
}
