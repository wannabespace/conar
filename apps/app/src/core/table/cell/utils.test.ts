import { describe, expect, it } from 'bun:test'

import { isNumericColumn } from './utils'

const numeric = (type: string) =>
  isNumericColumn({ id: 'c', type, uiType: 'raw' })

describe('isNumericColumn', () => {
  it('matches numeric types across engines but not look-alikes', () => {
    expect(
      ['int4', 'UInt64', 'Decimal(10, 2)', 'double precision', 'money'].map(
        numeric
      )
    ).toEqual([true, true, true, true, true])
    expect(['interval', 'point', 'text', 'uuid'].map(numeric)).toEqual([
      false,
      false,
      false,
      false,
    ])
  })
})
