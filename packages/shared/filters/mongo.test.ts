import { describe, expect, it } from 'bun:test'

import { toMongoPipeline } from './mongo'
import type { FilterOperator } from './types'

const ref = (operator: FilterOperator) => ({
  label: operator,
  operator,
  symbol: operator,
})

describe('toMongoPipeline', () => {
  it('returns no stages without conditions', () => {
    expect(toMongoPipeline([])).toEqual([])
  })

  it('translates operators and concatenation', () => {
    expect(
      toMongoPipeline(
        [
          { column: 'age', ref: ref('gte'), values: [18] },
          { column: 'role', ref: ref('in'), values: ['admin', 'owner'] },
          { column: 'deletedAt', ref: ref('isNull'), values: [] },
        ],
        'OR'
      )
    ).toEqual([
      {
        $match: {
          $or: [
            { age: { $gte: 18 } },
            { role: { $in: ['admin', 'owner'] } },
            { deletedAt: { $eq: null } },
          ],
        },
      },
    ])
  })

  it('turns LIKE patterns into anchored regexes', () => {
    expect(
      toMongoPipeline([
        { column: 'email', ref: ref('ilike'), values: [String.raw`%a.b\_c_`] },
      ])
    ).toEqual([
      {
        $match: {
          $and: [{ email: { $options: 'i', $regex: String.raw`^.*a\.b_c.$` } }],
        },
      },
    ])
  })

  it('matches a filter through a reference against the referenced documents', () => {
    expect(
      toMongoPipeline([
        { column: 'status', ref: ref('eq'), values: ['active'] },
        {
          column: 'userId',
          ref: ref('eq'),
          values: ['ada@example.com'],
          via: { key: '_id', schema: 'app', table: 'users', target: 'email' },
        },
      ])
    ).toEqual([
      {
        $lookup: {
          as: '__via_1',
          foreignField: '_id',
          from: 'users',
          localField: 'userId',
          pipeline: [
            { $match: { email: { $eq: 'ada@example.com' } } },
            { $limit: 1 },
          ],
        },
      },
      {
        $match: {
          $and: [{ status: { $eq: 'active' } }, { __via_1: { $ne: [] } }],
        },
      },
      { $unset: ['__via_1'] },
    ])
  })
})
