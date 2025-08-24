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
