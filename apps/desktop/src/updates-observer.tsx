import { useQuery } from '@tanstack/react-query'
import { Store, useStore } from '@tanstack/react-store'
import { useEffect } from 'react'
import { toast } from 'sonner'

export type UpdatesStatus = 'no-updates' | 'checking' | 'downloading' | 'ready' | 'error'

const TOAST_UPDATE_READY_ID = 'update-ready-toast'

export const updatesStore = new Store<{
  version: string
  status: UpdatesStatus
  message?: string
}>({
  status: 'no-updates',
  version: '',
  message: undefined,
})

export async function checkForUpdates() {
  await window.electron.app.checkForUpdates()
}

export function UpdatesObserver() {
  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: () => window.electron.versions.app(),
  })
  const status = useStore(updatesStore, state => state.status)

  useEffect(() => {
    window.electron.app.onUpdatesStatus(({ status, message }) => {
      updatesStore.setState(state => ({ ...state, status, message }))
    })
  }, [])

  useEffect(() => {
    if (version) {
      updatesStore.setState(state => ({ ...state, version }))
    }
  }, [version])

  useEffect(() => {
    if (status === 'ready') {
      function showToast() {
        toast.success('New update successfully downloaded', {
          id: TOAST_UPDATE_READY_ID,
          action: {
            label: 'Update now',
            onClick: () => window.electron.app.quitAndInstall(),
          },
          position: 'bottom-right',
          duration: 30000,
        })
      }

      showToast()
      const interval = setInterval(showToast, 1000 * 60 * 10)

      return () => clearInterval(interval)
    }
  }, [status])

  return <></>
}
