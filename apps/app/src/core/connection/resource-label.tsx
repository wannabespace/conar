import { Skeleton } from '@tamery/ui/components/skeleton'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { connectionCurrentDatabaseQueryOptions } from '~/core/queries/connection/current-database'

import { useFetchingConfig } from './fetching'
import type { Connection } from './sync'

/** A resource whose string names no database shows the one the server opens, or All databases where the server opens none (MySQL); `prefix` renders only beside a label, so nothing is left behind while the server can't be asked. */
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
  const serverDatabase = data === null ? 'All databases' : data
  const label =
    name ||
    (canSend && isPending ? (
      <Skeleton className="inline-block h-3 w-16 align-middle" />
    ) : (
      serverDatabase
    ))

  return label ? (
    <>
      {prefix}
      {label}
    </>
  ) : null
}
