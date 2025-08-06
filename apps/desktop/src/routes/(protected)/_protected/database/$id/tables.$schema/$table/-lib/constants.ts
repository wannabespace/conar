/**
 * Constants for table components
 */

export const selectSymbol = Symbol('table-selection')

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 160],
  ['timestamp', 240],
  ['timestamptz', 240],
  ['float', 150],
  ['uuid', 290],
])

export const DEFAULT_COLUMN_WIDTH = 200