import { SafeURL } from '@tamery/shared/safe-url'

export const DEFAULT_PAGE_LIMIT = 100

export const getValueForEditor = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value, null, 2)
}

export const wrapExplainQuery = (query: string) => {
  const trimmedQuery = query.trim().toLowerCase()
  return trimmedQuery.startsWith('explain') ? query : `EXPLAIN ${query.trim()}`
}

export const getConnectionStringToShow = (
  connectionString: string,
  {
    withPathname = false,
    withProtocol = false,
  }: { withPathname?: boolean; withProtocol?: boolean } = {}
) => {
  const parsed = new SafeURL(connectionString)
  return `${withProtocol ? `${parsed.protocol}//` : ''}${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}${withPathname && parsed.pathname !== '/' ? parsed.pathname : ''}`
}

export const groupInSchema = <T extends { schema: string }, G>(
  items: T[],
  schema: string | undefined,
  {
    key,
    merge,
    seed,
  }: {
    key: (item: T) => string
    merge: (group: G, item: T) => void
    seed: (item: T) => G
  }
) => {
  const grouped = new Map<string, G>()

  for (const item of items) {
    if (item.schema !== schema) {
      continue
    }
    const id = key(item)
    const group = grouped.get(id) ?? seed(item)

    merge(group, item)
    grouped.set(id, group)
  }

  return [...grouped.values()]
}
