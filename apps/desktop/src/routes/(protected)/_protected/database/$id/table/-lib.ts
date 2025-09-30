export const selectSymbol = Symbol('table-selection')

export const columnsSizeMap = new Map<string, number>([
  ['boolean', 160],
  ['number', 180],
  ['integer', 150],
  ['bigint', 190],
  ['timestamp', 240],
  ['timestamptz', 240],
  ['float', 180],
  ['uuid', 320],
])
