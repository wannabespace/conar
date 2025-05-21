import * as React from 'react'
import { useIsomorphicEffect } from './use-isomorphic-effect'

export function usePromise<T>(promiseFn: () => Promise<T>): T | null
export function usePromise<T, D extends T>(promiseFn: () => Promise<T>, initialData: D): T
export function usePromise<T, D extends T>(
  promiseFn: () => Promise<T>,
  initialData?: D,
) {
  const [data, setData] = React.useState<T | null>(initialData || null)

  useIsomorphicEffect(() => {
    promiseFn().then(setData)
  }, [])

  return data
}
