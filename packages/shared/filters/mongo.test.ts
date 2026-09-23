import { describe, expect, it } from 'bun:test'

import { toMongoFilter } from './mongo'
import type { FilterOperator } from './types'

const ref = (operator: FilterOperator) => ({
  label: operator,
  operator,
  symbol: operator,
})

describe('toMongoFilter', () => {
  it('returns an empty filter without conditions', () => {
    expect(toMongoFilter([])).toEqual({})
  })

  it('translates operators and concatenation', () => {
    expect(
      toMongoFilter(
        [
          { column: 'age', ref: ref('gte'), values: [18] },
          { column: 'role', ref: ref('in'), values: ['admin', 'owner'] },
          { column: 'deletedAt', ref: ref('isNull'), values: [] },
        ],
        'OR'
      )
    ).toEqual({
      $or: [
        { age: { $gte: 18 } },
        { role: { $in: ['admin', 'owner'] } },
        { deletedAt: { $eq: null } },
      ],
    })
  })

  it('turns LIKE patterns into anchored regexes', () => {
    expect(
      toMongoFilter([
        { column: 'email', ref: ref('ilike'), values: [String.raw`%a.b\_c_`] },
      ])
    ).toEqual({
      $and: [{ email: { $options: 'i', $regex: String.raw`^.*a\.b_c.$` } }],
    })
  })
})
