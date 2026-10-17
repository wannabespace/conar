import { Skeleton } from '@tamery/ui/components/skeleton'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { connectionCurrentDatabaseQueryOptions } from '~/core/queries/connection/current-database'

import { useFetchingConfig } from './fetching'
import type { Connection } from './sync'

/** A resource whose string names no database shows the one the server opens; `prefix` renders only beside a name, so nothing is left behind where the server has none (MySQL). */
export const ResourceLabel = ({
  connection,
  name,
  prefix,
}: {
  connection: Connection
  name: string | null
  prefix?: ReactNode
}) => {
  const { canSend } = useFetchingConfig(connection)
  const { data, isPending } = useQuery({
    ...connectionCurrentDatabaseQueryOptions(connection),
    enabled: canSend && !name,
  })
  const label =
    name ||
    (canSend && isPending ? (
      <Skeleton className="inline-block h-3 w-16 align-middle" />
    ) : (
      data
    ))

  return label ? (
    <>
      {prefix}
      {label}
    </>
  ) : null
}
