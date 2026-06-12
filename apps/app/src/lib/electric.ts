import type { ElectricCollectionConfig } from '@tanstack/electric-db-collection'
import { snakeCamelMapper } from '@electric-sql/client'
import { apiUrl } from '~/utils/utils'
import { bearerToken } from './auth'

export function shapeOptions(entity: string) {
  return {
    url: new URL(`/shapes/${entity}`, apiUrl).toString(),
    columnMapper: snakeCamelMapper(),
    liveSse: true,
    headers: {
      Authorization: () => {
        const token = bearerToken.get()
        return token ? `Bearer ${token}` : ''
      },
    },
    fetchClient: ((url, init) => globalThis.fetch(url, {
      ...init,
      credentials: 'include',
    })) as typeof fetch,
  } satisfies ElectricCollectionConfig['shapeOptions']
}
