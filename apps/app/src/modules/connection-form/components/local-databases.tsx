import { tryCatchAsync } from '@tamery/shared/utils'
import { Button } from '@tamery/ui/components/button'
import { ConnectionIcon } from '@tamery/ui/components/icons/connection-icon'
import { isMac } from '@tamery/ui/lib/os'
import { useSelector } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'

import { plural } from '~/utils/plural'

import type { ConnectionForm } from '../lib/connection-form'
import type { PasteVia } from '../lib/use-paste-connection'

export type LocalDatabase = Awaited<
  ReturnType<NonNullable<typeof window.electron>['localDatabases']['find']>
>[number]

/** Fills the form at once, and the password when the source hands it out, which can wait on a Keychain prompt. `passwordWithheldBy` names the app whose Keychain password the user denied, while the form still holds its server. */
export const usePickLocalDatabase = ({
  form,
  read,
}: {
  form: ConnectionForm
  read: (text: string, via: PasteVia) => void
}) => {
  const unlocking = useRef<string>(null)
  const [withheld, setWithheld] = useState<{ host: string; source: string }>()
  const host = useSelector(form.store, ({ values }) => values.host)

  const pick = async ({
    connectionString,
    engine,
    name,
    source,
  }: LocalDatabase) => {
    setWithheld(undefined)
    // Replaces the form rather than merging like a paste: another pick on the same host would keep the previous password, database and options.
    form.reset()
    read(connectionString, 'found')
    form.setFieldValue('name', name)
    form.setFieldValue('engine', engine)
    if (unlocking.current === connectionString) {
      return
    }
    unlocking.current = connectionString
    const { data: unlocked } = await tryCatchAsync(
      async () => await window.electron?.localDatabases.unlock(connectionString)
    )
    if (unlocking.current !== connectionString) {
      return
    }
    unlocking.current = null
    if (unlocked?.password) {
      form.setFieldValue('password', unlocked.password)
    }
    if (unlocked?.withheld) {
      setWithheld({ host: form.state.values.host, source })
    }
  }

  return {
    passwordWithheldBy: withheld?.host === host ? withheld.source : undefined,
    pick,
  }
}

/** Desktop only: the web has no way to look around the machine. */
export const LocalDatabases = ({
  onPick,
}: {
  onPick: (database: LocalDatabase) => void
}) => {
  const { data: databases = [] } = useQuery({
    queryFn: async () => (await window.electron?.localDatabases.find()) ?? [],
    queryKey: ['localDatabases'],
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
      {databases.map((database) => (
        <Button
          key={database.connectionString}
          type="button"
          variant="ghost-tint"
          size="sm"
          className="justify-start"
          onClick={() => onPick(database)}
        >
          <ConnectionIcon engine={database.engine} className="mr-1" />
          <span data-mask className="truncate">
            {database.name}
          </span>
          <span className="text-muted-foreground ml-auto pl-4 text-xs">
            {database.source}
          </span>
        </Button>
      ))}
    </motion.div>
  )
}
