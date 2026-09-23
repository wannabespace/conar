import type { ActiveFilter, FilterOperator } from './types'

const escapeRegex = (text: string) =>
  text.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`)

const LIKE_WILDCARDS: Record<string, string> = { '%': '.*', _: '.' }

const likeToRegex = (pattern: unknown) =>
  `^${String(pattern).replaceAll(/\\?[\s\S]/gu, (token) =>
    token.length === 2
      ? escapeRegex(token.slice(1))
      : (LIKE_WILDCARDS[token] ?? escapeRegex(token))
  )}$`

const MONGO_CONDITIONS: Record<
  FilterOperator,
  (values: unknown[]) => Record<string, unknown>
> = {
  eq: ([value]) => ({ $eq: value }),
  gt: ([value]) => ({ $gt: value }),
  gte: ([value]) => ({ $gte: value }),
  ilike: ([value]) => ({ $options: 'i', $regex: likeToRegex(value) }),
  in: (values) => ({ $in: values }),
  isNotNull: () => ({ $ne: null }),
  isNull: () => ({ $eq: null }),
  like: ([value]) => ({ $regex: likeToRegex(value) }),
  lt: ([value]) => ({ $lt: value }),
  lte: ([value]) => ({ $lte: value }),
  ne: ([value]) => ({ $ne: value }),
  notIn: (values) => ({ $nin: values }),
  notLike: ([value]) => ({ $not: { $regex: likeToRegex(value) } }),
}

export const toMongoFilter = (
  filters: ActiveFilter[],
  concatOperator: 'AND' | 'OR' = 'AND'
) =>
  filters.length === 0
    ? {}
    : {
        [concatOperator === 'AND' ? '$and' : '$or']: filters.map((filter) => ({
          [filter.column]: MONGO_CONDITIONS[filter.ref.operator](filter.values),
        })),
      }
