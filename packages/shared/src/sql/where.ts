import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { CustomOperator, FilterOperator, SQLOperator } from '@conar/shared/utils/sql'
import { prepareSql } from '@conar/shared/utils/helpers'
import { FILTER_OPERATORS_LIST } from '@conar/shared/utils/sql'

export interface WhereFilter {
  column: string
  operator: FilterOperator
  values?: string[]
}

export interface CustomWhereFilter<T extends CustomOperator = CustomOperator> extends WhereFilter {
  operator: T
}

export interface SQLWhereFilter<T extends SQLOperator = SQLOperator> extends WhereFilter {
  operator: T
}

export const CUSTOM_OPERATORS_TRANSFORMERS: { [Key in CustomOperator]: (filter: CustomWhereFilter<Key>) => SQLWhereFilter } = {
  '≈': ({ column, values }) => ({ column, operator: 'ILIKE', values: values?.map(v => `%${v}%`) }),
}

export function whereSql(filters: WhereFilter[], concatOperator: 'AND' | 'OR' = 'AND'): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(filters.map((filter) => {
      const operator = FILTER_OPERATORS_LIST.find(o => o.value === filter.operator)

      if (!operator)
        throw new Error(`Invalid operator: ${filter.operator}`)

      filter = CUSTOM_OPERATORS_TRANSFORMERS[operator.value as CustomOperator]?.(filter as CustomWhereFilter) ?? filter

      if (!operator.hasValue) {
        return `"${filter.column}" ${filter.operator}`
      }

      if (filter.values && filter.values.length > 0) {
        if (operator.value.toLowerCase().includes('in')) {
          return `"${filter.column}" ${filter.operator} (${filter.values.map(v => `'${v.trim()}'`).join(', ')})`
        }

        return `"${filter.column}" ${filter.operator} '${filter.values[0]}'`
      }

      return `"${filter.column}" ${filter.operator}`
    }).join(` ${concatOperator} `)),
  }
}
