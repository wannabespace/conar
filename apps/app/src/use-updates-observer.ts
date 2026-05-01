import type { UpdatesStatus } from '@conar/shared/utils/updates'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createStore } from 'seitu'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import packageJson from '../../desktop/package.json'
import { queryClient } from './main'

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
  version: packageJson.version,
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
        return packageJson.version

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
