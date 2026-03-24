import { toastManager } from '@conar/ui/components/toast'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'
import { version as packageVersion } from '../package.json'
import { queryClient } from './main'

export type UpdatesStatus = 'no-updates' | 'checking' | 'downloading' | 'ready' | 'error'

const TOAST_UPDATE_READY_ID = 'update-ready-toast'

export async function checkForUpdates() {
  await window.electron?.app.checkForUpdates()
}

checkForUpdates()

export const updatesStore = createStore<{
  version: string
  status: UpdatesStatus
  message?: string
}>({
  status: 'no-updates',
  version: packageVersion,
  message: undefined,
})

window.electron?.app.onUpdatesStatus(({ status, message }) => {
  updatesStore.set(state => ({ ...state, status, message } satisfies typeof state))
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
  const status = useSubscription(updatesStore, { selector: state => state.status })

  useEffect(() => {
    if (version) {
      updatesStore.set(state => ({ ...state, version } satisfies typeof state))
    }
  }, [version])

  useEffect(() => {
    if (status === 'ready') {
      function showToast() {
        toastManager.add({
          title: 'New update downloaded!',
          type: 'success',
          id: TOAST_UPDATE_READY_ID,
          actionProps: {
            children: 'Restart',
            onClick: () => window.electron?.app.quitAndInstall(),
          },
          timeout: 60000,
        })
      }

      showToast()
      const interval = setInterval(showToast, 1000 * 60 * 10)

      return () => clearInterval(interval)
    }
  }, [status])
}
