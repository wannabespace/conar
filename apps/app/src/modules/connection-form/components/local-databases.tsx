import { connectionParts } from '@tamery/connection/connection-parts'
import { engines } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { isMac } from '@tamery/ui/lib/os'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'

import { plural } from '~/utils/plural'

export type LocalDatabase = Awaited<
  ReturnType<NonNullable<typeof window.electron>['localDatabases']['find']>
>[number]

/** Desktop only: the web has no way to look around the machine. */
export const LocalDatabases = ({
  onPick,
}: {
  onPick: (database: LocalDatabase) => void
}) => {
  const { data: databases = [] } = useQuery({
    queryFn: async () => (await window.electron?.localDatabases.find()) ?? [],
    queryKey: ['localDatabases'],
    staleTime: 0,
  })

  if (databases.length === 0) {
    return null
  }

  return (
    <motion.div
      className="-mx-3 flex flex-col gap-0.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      <span className="text-muted-foreground px-3 pb-1 text-xs font-medium">
        Found {plural(databases.length, 'database')} on{' '}
        {isMac ? 'this Mac' : 'this computer'}
      </span>
      {databases.map((database) => {
        const { flavor, type } = connectionParts.parse(
          database.connectionString
        )
        return (
          <Button
            key={database.connectionString}
            type="button"
            variant="ghost-tint"
            size="sm"
            className="justify-start"
            onClick={() => onPick(database)}
          >
            {type && (
              <ConnectionIcon
                engine={engines.of({ flavor, type })}
                className="mr-1"
              />
            )}
            <span data-mask className="truncate">
              {database.name}
            </span>
            <span className="text-muted-foreground ml-auto pl-4 text-xs">
              {database.source}
            </span>
          </Button>
        )
      })}
    </motion.div>
  )
}
