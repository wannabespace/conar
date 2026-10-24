import { type } from 'arktype'

export const columnKind = type.enumerated(
  'binary',
  'boolean',
  'date',
  'json',
  'key',
  'link',
  'list',
  'number',
  'select',
  'text',
  'time',
  'uuid'
)

export type ColumnKind = typeof columnKind.infer
