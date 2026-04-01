import type { ActiveFilter, Filter } from '@conar/shared/filters'
import type { Store } from 'seitu'
import type { GeneratorId } from '~/entities/connection/utils/seeds'
import { memoize } from '@conar/shared/utils/helpers'
import { type } from 'arktype'
import { createContext, use } from 'react'
import { repairWebStorageValueObjectWithDefault } from 'seitu/utils'
import { createWebStorageValue } from 'seitu/web'

export interface SelectionState {
  anchorIndex: number | null
  focusIndex: number | null
  lastExpandDirection: 'up' | 'down' | null
}

export const storeState = type({
  selected: 'Record<string, string>[]',
  filters: type({
    column: 'string',
    ref: 'object' as type.cast<Filter>,
    values: 'string[]',
  }).array() as type.cast<ActiveFilter[]>,
  exact: 'boolean',
  hiddenColumns: 'string[]',
  orderBy: {
    '[string]': '"ASC" | "DESC"',
  },
  prompt: 'string',
  columnSizes: 'Record<string, number>',
  lastClickedIndex: 'number | null',
  selectionState: 'object' as type.cast<SelectionState>,
  generators: {
    '[string]': {
      generatorId: 'string' as type.cast<GeneratorId>,
      isNullable: 'boolean',
    },
  },
})

const defaultState: typeof storeState.infer = {
  selected: [],
  filters: [],
  exact: false,
  prompt: '',
  hiddenColumns: [],
  orderBy: {},
  columnSizes: {},
  lastClickedIndex: null,
  selectionState: { anchorIndex: null, focusIndex: null, lastExpandDirection: null },
  generators: {},
}

export const tablePageStore = memoize(({ id, schema, table }: { id: string, schema: string, table: string }) => createWebStorageValue({
  type: 'localStorage',
  key: `${id}.${schema}-${table}.store`,
  defaultValue: defaultState,
  schema: storeState,
  onValidationError: repairWebStorageValueObjectWithDefault,
}))

export const TablePageStoreContext = createContext<Store<typeof storeState.infer>>(null!)

export function useTablePageStore() {
  return use(TablePageStoreContext)
}
