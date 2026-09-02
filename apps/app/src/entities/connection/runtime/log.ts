import { type } from 'arktype'
import { createStore } from 'seitu'
import { createWebStorageValue } from 'seitu/web'

import { LOGGER_DEFAULT_HEIGHT, LOGGER_HEIGHT_KEY } from '~/lib/storage-keys'

export const LOGGER_MIN_HEIGHT = 120
export const LOGGER_MAX_HEIGHT = 720

export const loggerHeightValue = createWebStorageValue({
  defaultValue: LOGGER_DEFAULT_HEIGHT,
  key: LOGGER_HEIGHT_KEY,
  schema: type('number'),
  type: 'localStorage',
})

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
