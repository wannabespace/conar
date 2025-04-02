export * from './cell'
export * from './footer'
export * from './head'
export * from './header'
export * from './row'
export * from './skeleton'
export * from './table'

export const DEFAULT_ROW_HEIGHT = 35
export const DEFAULT_COLUMN_WIDTH = 220

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 150],
  ['number', 150],
  ['integer', 120],
  ['bigint', 150],
  ['float', 150],
  ['uuid', 290],
])
