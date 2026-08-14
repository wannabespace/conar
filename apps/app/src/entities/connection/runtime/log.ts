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

export const queryLogsStore = createStore<
  Record<string, Record<string, QueryLog>>
>({})

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
  const id = crypto.randomUUID()

  queryLogsStore.set(
    (state) =>
      ({
        ...state,
        [resourceId]: {
          ...state[resourceId],
          [id]: {
            createdAt: new Date(),
            duration: null,
            error: null,
            id,
            query,
            result: null,
            values,
          },
        },
      }) satisfies typeof state
  )

  try {
    const { result, duration } = await promise

    queryLogsStore.set((state) => {
      const resourceLogs = state[resourceId] ?? {}
      const existingLog = resourceLogs[id]
      if (!existingLog) {
        return state
      }

      return {
        ...state,
        [resourceId]: {
          ...resourceLogs,
          [id]: {
            ...existingLog,
            duration,
            result,
          },
        },
      } satisfies typeof state
    })
  } catch (error) {
    queryLogsStore.set((state) => {
      const resourceLogs = state[resourceId] ?? {}
      const existingLog = resourceLogs[id]
      if (!existingLog) {
        return state
      }

      return {
        ...state,
        [resourceId]: {
          ...resourceLogs,
          [id]: {
            ...existingLog,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      } satisfies typeof state
    })
  }
}
