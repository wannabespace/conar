export const selectSymbol = Symbol('table-selection')

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 160],
  ['number', 170],
  ['integer', 150],
  ['bigint', 170],
  ['timestamp', 240],
  ['timestamptz', 240],
  ['float', 170],
  ['uuid', 290],
])
