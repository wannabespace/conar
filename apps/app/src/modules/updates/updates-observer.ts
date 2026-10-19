import type { UpdatesStatus } from '@tamery/shared/updates'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'

import packageJson from '~/../../desktop/package.json' with { type: 'json' }
import { posthog } from '~/lib/posthog'
import { queryClient } from '~/lib/query-client'

export const installUpdate = () => {
  posthog.capture('update_installed')
  window.electron?.app.quitAndInstall()
}

export const checkForUpdates = async () => {
  await window.electron?.app.checkForUpdates()
}

checkForUpdates()

export const updatesStore = createStore<{
  version: string
  status: UpdatesStatus
  message?: string
}>({
  message: undefined,
  status: 'no-updates',
  version: packageJson.version,
})

window.electron?.app.onUpdatesStatus(({ status, message }) => {
  updatesStore.set(
    (state) => ({ ...state, message, status }) satisfies typeof state
  )
})

export const UpdatesObserver = () => {
  const { data: version } = useQuery(
    {
      queryFn: () => {
        if (!window.electron) {
          return packageJson.version
        }

        return window.electron.versions.app()
      },
      queryKey: ['version'],
    },
    queryClient
  )
  const status = useSubscription(updatesStore, {
    selector: (state) => state.status,
  })

  useEffect(() => {
    if (version) {
      updatesStore.set(
        (state) => ({ ...state, version }) satisfies typeof state
      )
    }
  }, [version])

  useEffect(() => {
    if (status === 'ready') {
      posthog.capture('update_downloaded')
    }
  }, [status])

  return null
}
