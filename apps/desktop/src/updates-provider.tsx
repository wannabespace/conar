// import { autoUpdater } from 'electron-updater'
import { createContext, use, useState } from 'react'
// import { toast } from 'sonner'
import { useAsyncEffect } from './hooks/use-async-effect'
import { useSession } from './hooks/use-session'

type Status = 'idle' | 'updating' | 'ready'

const UpdatesContext = createContext<{
  status: Status
  relaunch: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

// TODO: refactor this to be a component
export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSession()
  const [status, setStatus] = useState<Status>('idle')

  useAsyncEffect(async () => {
    if (!data)
      return

    // autoUpdater.addAuthHeader(`Bearer ${data.session.token}`)

    setStatus('idle')

    // const update = await autoUpdater.checkForUpdates()

    // if (!update)
    //   return

    // toast.info(
    //   `Found new update ${update.updateInfo.version}. We will download it now but install it on relaunch.`,
    // )

    setStatus('updating')

    // await autoUpdater.downloadUpdate()

    setStatus('ready')

    // autoUpdater.quitAndInstall()
  }, [data])

  return (
    <UpdatesContext value={{ status, relaunch: async () => {} }}>
      {children}
    </UpdatesContext>
  )
}
