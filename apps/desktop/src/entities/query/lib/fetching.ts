import { drizzleFn, ensureDrizzleQuery, useDrizzleLive } from '~/hooks/use-drizzle-live'

function queriesFn(databaseId: string) {
  return drizzleFn(query => query.queries.findMany({
    where: (tables, { eq }) => eq(tables.databaseId, databaseId),
    orderBy: (tables, { desc }) => desc(tables.createdAt),
  }))
}

export function ensureQueries(databaseId: string) {
  return ensureDrizzleQuery(queriesFn(databaseId))
}

export function useQueriesLive(databaseId: string) {
  return useDrizzleLive({
    fn: queriesFn(databaseId),
  })
}
