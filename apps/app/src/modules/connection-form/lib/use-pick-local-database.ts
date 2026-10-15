import { tryCatchAsync } from '@tamery/shared/utils'
import { useSelector } from '@tanstack/react-form'
import { useRef, useState } from 'react'

import type { ConnectionForm } from './connection-form'
import type { PasteVia } from './use-paste-connection'

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
