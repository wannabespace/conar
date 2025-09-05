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
  await window.electron?.app.checkForUpdates()
}

export function UpdatesObserver() {
  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: () => {
      if (!window.electron)
        throw new Error('window.electron is not defined')

      return window.electron.versions.app()
    },
  })
  const status = useStore(updatesStore, state => state.status)

  useEffect(() => {
    window.electron?.app.onUpdatesStatus(({ status, message }) => {
      updatesStore.setState(state => ({ ...state, status, message }))
    })
  }, [])

  useEffect(() => {
    if (version) {
      updatesStore.setState(state => ({ ...state, version }))
    }
    updatesStore.setState(state => ({ ...state, status: 'ready', message: 'Hello' }))
  }, [version])

  useEffect(() => {
    if (status === 'ready') {
      function showToast() {
        toast.success('New update downloaded!', {
          id: TOAST_UPDATE_READY_ID,
          description: updatesStore.state.message
            ? (
                <>
                  What’s new:
                  <br />
                  {updatesStore.state.message}
                </>
              )
            : null,
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

  return null
}
