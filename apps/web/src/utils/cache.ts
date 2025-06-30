import { subHours } from 'date-fns'

interface Persisted<T> {
  data: T
  timestamp: number
}

export function createCache<T>({
  key,
  hours = 1,
  storage = typeof window !== 'undefined'
    ? localStorage
    : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      },
}: {
  key: string
  hours?: number
  storage?: {
    getItem: (key: string) => string | null
    setItem: (key: string, value: string) => void
    removeItem: (key: string) => void
  }
}) {
  const get = () => {
    if (typeof window === 'undefined')
      return

    const stored = storage.getItem(key)
    if (!stored)
      return

    const persisted = JSON.parse(stored) as Persisted<T>
    const hoursAgo = subHours(new Date(), hours).getTime()

    if (persisted.timestamp < hoursAgo) {
      storage.removeItem(key)
      return
    }

    return persisted.data
  }

  const set = (data: T) => {
    if (typeof window === 'undefined')
      return

    const persisted: Persisted<T> = {
      data,
      timestamp: Date.now(),
    }
    storage.setItem(key, JSON.stringify(persisted))
  }

  return {
    get,
    set,
  }
}
