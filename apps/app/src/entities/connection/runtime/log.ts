import { createStore } from 'seitu'

export interface QueryLog {
  id: string
  query: string
  createdAt: Date
  result: unknown | null
  duration: number | null
  values: unknown[]
  error: string | null
}

const LOG_LIMIT = 500

const stores = new Map<string, ReturnType<typeof createStore<QueryLog[]>>>()

export const getQueryLogsStore = (resourceId: string) => {
  let store = stores.get(resourceId)

  if (!store) {
    store = createStore<QueryLog[]>([])
    stores.set(resourceId, store)
  }

  return store
}

const patchLog = (
  store: ReturnType<typeof getQueryLogsStore>,
  id: string,
  patch: Partial<QueryLog>
) =>
  store.set((logs) =>
    logs.map((log) => (log.id === id ? { ...log, ...patch } : log))
  )

export const logQuery = async ({
  resourceId,
  promise,
  query,
  values = [],
}: {
  resourceId: string
  promise: Promise<{ result: unknown; duration: number }>
  query: string
  values?: unknown[]
}) => {
  const store = getQueryLogsStore(resourceId)
  const id = crypto.randomUUID()

  store.set((logs) =>
    [
      ...logs,
      {
        createdAt: new Date(),
        duration: null,
        error: null,
        id,
        query,
        result: null,
        values,
      },
    ].slice(-LOG_LIMIT)
  )

  try {
    const { result, duration } = await promise
    patchLog(store, id, { duration, result })
  } catch (error) {
    patchLog(store, id, {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
