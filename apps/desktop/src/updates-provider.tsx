import { useSuspenseQuery } from '@tanstack/react-query'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export type UpdatesStatus = 'no-updates' | 'checking' | 'downloading' | 'ready' | 'error'

const UpdatesContext = createContext<{
  version: string
  status: UpdatesStatus
  message?: string
  checkForUpdates: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UpdatesStatus>('no-updates')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const { data: version } = useSuspenseQuery({
    queryKey: ['version'],
    queryFn: () => window.electron.versions.app(),
  })

  async function checkForUpdates() {
    if (import.meta.env.PROD) {
      await window.electron.app.checkForUpdates()
    }
  }

  useEffect(() => {
    window.electron.app.onUpdatesStatus(({ status, message }) => {
      setStatus(status)
      setMessage(message)
    })
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV)
      return

    checkForUpdates()

    const interval = setInterval(checkForUpdates, 1000 * 60 * 30)

    return () => clearInterval(interval)
  }, [])

  async function installUpdate() {
    await window.electron.app.quitAndInstall()
  }

  useEffect(() => {
    if (status === 'ready') {
      function showToast() {
        toast.success('New update successfully downloaded', {
          action: {
            label: 'Install',
            onClick: () => installUpdate(),
          },
          duration: 10000,
        })
      }

      showToast()
      const interval = setInterval(showToast, 1000 * 60 * 30)

      return () => clearInterval(interval)
    }
  }, [status])

  const value = useMemo(() => ({ status, message, version, checkForUpdates }), [status, message, version])

  return (
    <UpdatesContext value={value}>
      {children}
    </UpdatesContext>
  )
}
