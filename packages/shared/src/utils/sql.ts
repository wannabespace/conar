export const CUSTOM_OPERATORS = [
  '≈',
] as const

export type CustomOperator = typeof CUSTOM_OPERATORS[number]

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

export type SQLOperator = typeof SQL_OPERATORS[number]

export type FilterOperator = SQLOperator | CustomOperator

export interface FilterRecord<T extends string = FilterOperator> {
  label: string
  value: T
  hasValue: boolean
  tip?: string
}

export const SQL_OPERATORS_LIST: FilterRecord<SQLOperator>[] = [
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

export const CUSTOM_OPERATORS_LIST: (FilterRecord<CustomOperator> & { tip: string })[] = [
  { label: 'Includes', value: '≈', hasValue: true, tip: '<column> ILIKE "%<query>%"' },
]

export const FILTER_OPERATORS_LIST: FilterRecord[] = [
  ...SQL_OPERATORS_LIST,
  ...CUSTOM_OPERATORS_LIST,
]
