import { useQuery } from '@tanstack/react-query'
import { Store, useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { version as packageVersion } from '../package.json'
import { queryClient } from './main'

export type UpdatesStatus = 'no-updates' | 'checking' | 'downloading' | 'ready' | 'error'

const TOAST_UPDATE_READY_ID = 'update-ready-toast'

export async function checkForUpdates() {
  await window.electron?.app.checkForUpdates()
}

checkForUpdates()

export const updatesStore = new Store<{
  version: string
  status: UpdatesStatus
  message?: string
}>({
  status: 'no-updates',
  version: packageVersion,
  message: undefined,
})

window.electron?.app.onUpdatesStatus(({ status, message }) => {
  updatesStore.setState(state => ({ ...state, status, message } satisfies typeof state))
})

export function useUpdatesObserver() {
  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: () => {
      if (!window.electron)
        return packageVersion

      return window.electron.versions.app()
    },
  }, queryClient)
  const status = useStore(updatesStore, state => state.status)

  useEffect(() => {
    if (version) {
      updatesStore.setState(state => ({ ...state, version } satisfies typeof state))
    }
  }, [version])

  useEffect(() => {
    if (status === 'ready') {
      function showToast() {
        toast.success('New update downloaded!', {
          id: TOAST_UPDATE_READY_ID,
          action: {
            label: 'Restart',
            onClick: () => window.electron?.app.quitAndInstall(),
          },
          position: 'bottom-right',
          duration: 60000,
        })
      }

      showToast()
      const interval = setInterval(showToast, 1000 * 60 * 10)

      return () => clearInterval(interval)
    }
  }, [status])
}
