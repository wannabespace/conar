import type { DatabaseType } from '@connnect/shared/enums/database-type'
import { prepareSql } from '@connnect/shared/utils/helpers'

export const SQL_OPERATORS = [
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'LIKE',
  'ILIKE',
  'NOT LIKE',
  'IN',
  'NOT IN',
  'IS NULL',
  'IS NOT NULL',
] as const

export interface SqlOperator {
  label: string
  value: typeof SQL_OPERATORS[number]
  hasValue: boolean
}

export const SQL_OPERATORS_LIST: SqlOperator[] = [
  { label: 'Equal', value: '=', hasValue: true },
  { label: 'Not equal', value: '!=', hasValue: true },
  { label: 'Greater than', value: '>', hasValue: true },
  { label: 'Greater than or equal', value: '>=', hasValue: true },
  { label: 'Less than', value: '<', hasValue: true },
  { label: 'Less than or equal', value: '<=', hasValue: true },
  { label: 'Like', value: 'LIKE', hasValue: true },
  { label: 'Ilike', value: 'ILIKE', hasValue: true },
  { label: 'Not like', value: 'NOT LIKE', hasValue: true },
  { label: 'In', value: 'IN', hasValue: true },
  { label: 'Not in', value: 'NOT IN', hasValue: true },
  { label: 'Is null', value: 'IS NULL', hasValue: false },
  { label: 'Is not null', value: 'IS NOT NULL', hasValue: false },
]

export interface WhereFilter {
  column: string
  operator: typeof SQL_OPERATORS[number]
  value?: string
}

export function whereSql(filters: WhereFilter[], concatOperator: 'AND' | 'OR' = 'AND'): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(filters.map((filter) => {
      const operator = SQL_OPERATORS_LIST.find(o => o.value === filter.operator)

      if (!operator)
        throw new Error(`Invalid operator: ${filter.operator}`)

      if (!operator.hasValue) {
        return `"${filter.column}" ${filter.operator}`
      }

      if (operator.value.toLowerCase().includes('in')) {
        return `"${filter.column}" ${filter.operator} (${filter.value!.split(',').map(v => `'${v.trim()}'`).join(',')})`
      }

      return `"${filter.column}" ${filter.operator} '${filter.value}'`
    }).join(` ${concatOperator} `)),
  }
}
