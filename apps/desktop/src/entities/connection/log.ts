import { Store } from '@tanstack/react-store'

export interface QueryLog {
  id: string
  query: string
  createdAt: Date
  result: unknown | null
  duration: number | null
  values: unknown[]
  error: string | null
}

export const queryLogsStore = new Store<Record<string, Record<string, QueryLog>>>({})

export async function logQuery({
  resourceId,
  promise,
  query,
  values = [],
}: {
  resourceId: string
  promise: Promise<{ result: unknown, duration: number }>
  query: string
  values?: unknown[]
}) {
  const id = crypto.randomUUID()

  queryLogsStore.setState(state => ({
    ...state,
    [resourceId]: {
      ...(state[resourceId] || {}),
      [id]: {
        id,
        createdAt: new Date(),
        query,
        values,
        result: null,
        duration: null,
        error: null,
      },
    },
  } satisfies typeof state))

  try {
    const { result, duration } = await promise

    queryLogsStore.setState(state => ({
      ...state,
      [resourceId]: {
        ...state[resourceId],
        [id]: {
          ...state[resourceId]![id]!,
          result,
          duration,
        },
      },
    } satisfies typeof state))
  }
  catch (error) {
    queryLogsStore.setState(state => ({
      ...state,
      [resourceId]: {
        ...state[resourceId],
        [id]: {
          ...state[resourceId]![id]!,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    } satisfies typeof state))
  }
}
