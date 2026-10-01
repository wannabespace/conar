import { createStore } from 'seitu'

const SLOW_QUERY_TIMEOUT = 10_000

export const slowQueries = createStore<Record<string, number[]>>({})

export const watchForSlowQuery = (resourceId: string) => {
  const startedAt = Date.now()
  const timer = setTimeout(
    () =>
      slowQueries.set((state) => ({
        ...state,
        [resourceId]: [...(state[resourceId] ?? []), startedAt],
      })),
    SLOW_QUERY_TIMEOUT
  )

  return () => {
    clearTimeout(timer)
    slowQueries.set((state) => {
      const { [resourceId]: pending = [], ...remaining } = state
      const rest = pending.filter((time) => time !== startedAt)

      return rest.length > 0 ? { ...remaining, [resourceId]: rest } : remaining
    })
  }
}
