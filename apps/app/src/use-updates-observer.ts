import type { UpdatesStatus } from '@tamery/shared/utils/updates'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import packageJson from '../../desktop/package.json'
import { queryClient } from './main'

const TOAST_UPDATE_READY_ID = 'update-ready-toast'

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

export const useUpdatesObserver = () => {
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
      const showToast = () => {
        toast.success('New update downloaded!', {
          action: {
            label: 'Restart',
            onClick: () => window.electron?.app.quitAndInstall(),
          },
          duration: 60_000,
          id: TOAST_UPDATE_READY_ID,
          position: 'bottom-right',
        })
      }

      showToast()
      const interval = setInterval(showToast, 1000 * 60 * 10)

      return () => clearInterval(interval)
    }
  }, [status])
}
