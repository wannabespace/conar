import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAsyncEffect } from './hooks/use-async-effect'

export type UpdatesStatus = 'no-updates' | 'checking' | 'updating' | 'ready' | 'error'

const UpdatesContext = createContext<{
  status: UpdatesStatus
  message?: string
  date?: string
  relaunch: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UpdatesStatus>('no-updates')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const [date, setDate] = useState<string | undefined>(undefined)

  useEffect(() => {
    window.electron.app.onUpdatesStatus(({ status, message, date }) => {
      setStatus(status)
      setMessage(message)
      setDate(date)
    })
    window.electron.app.checkForUpdates()
  }, [])

  useAsyncEffect(async () => {
    if (status === 'updating') {
      toast.info(
        `Found new update. We will download it now but install it on relaunch.`,
      )
    }
  }, [status])

  async function relaunch() {
    await window.electron.app.quitAndInstall()
  }

  const value = useMemo(() => ({ status, message, date, relaunch }), [status, message, date])

  return (
    <UpdatesContext value={value}>
      {children}
    </UpdatesContext>
  )
}
