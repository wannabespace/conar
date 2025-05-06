import * as React from 'react'

// eslint-disable-next-line ts/no-explicit-any
export function usePromise<T>(promiseFn: (...args: any[]) => Promise<T>): T | null
// eslint-disable-next-line ts/no-explicit-any
export function usePromise<T, D extends T>(promiseFn: (...args: any[]) => Promise<T>, initialData: D): T
export function usePromise<T, D extends T>(
  // eslint-disable-next-line ts/no-explicit-any
  promiseFn: (...args: any[]) => Promise<T>,
  initialData?: D,
) {
  const [data, setData] = React.useState<T | null>(initialData || null)

  React.useEffect(() => {
    promiseFn().then(setData)
  }, [promiseFn])

  return data
}
