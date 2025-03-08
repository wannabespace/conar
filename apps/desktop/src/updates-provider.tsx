import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAsyncEffect } from './hooks/use-async-effect'

export type UpdatesStatus = 'idle' | 'checking' | 'updating' | 'ready' | 'error'

const UpdatesContext = createContext<{
  status: UpdatesStatus
  relaunch: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UpdatesStatus>(window.initialUpdatesStatus ?? 'idle')

  useEffect(() => {
    window.electron.app.onUpdatesStatus((status) => {
      setStatus(status)
    })
  }, [])

  useAsyncEffect(async () => {
    if (status === 'updating') {
      toast.info(
        `Found new update ${await window.electron.app.checkForUpdates().then(r => r!.updateInfo.version)}. We will download it now but install it on relaunch.`,
      )
    }
  }, [status])

  async function relaunch() {
    await window.electron.app.quitAndInstall()
  }

  const value = useMemo(() => ({ status, relaunch }), [status])

  return (
    <UpdatesContext value={value}>
      {children}
    </UpdatesContext>
  )
}
