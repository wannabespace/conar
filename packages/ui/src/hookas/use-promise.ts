import * as React from 'react'
import { useIsomorphicEffect } from './use-isomorphic-effect'

export function usePromise<T>(promiseFn: () => Promise<T>): T | undefined
export function usePromise<T, D>(promiseFn: () => Promise<T>, initialData: D): T | D
export function usePromise<T, D>(
  promiseFn: () => Promise<T>,
  initialData?: D,
) {
  const [data, setData] = React.useState<T | D | undefined>(initialData)

  useIsomorphicEffect(() => {
    promiseFn().then(setData)
  }, [])

  return data
}
