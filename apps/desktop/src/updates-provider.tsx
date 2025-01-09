import { isTauri } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { createContext, use, useState } from 'react'
import { toast } from 'sonner'
import { env } from './env'
import { useAsyncEffect } from './hooks/use-async-effect'

type Status = 'idle' | 'updating' | 'ready'

const UpdatesContext = createContext<{
  status: Status
  relaunch: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

// TODO: refactor this to be a component
export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('idle')

  useAsyncEffect(async () => {
    if (!isTauri())
      return

    const update = await check({
      headers: {
        Authorization: `Bearer ${env.VITE_PUBLIC_UPDATES_TOKEN}`,
      },
    })

    if (!update)
      return

    toast.info(
      `Found new update ${update.version}. We will download it now but install it on relaunch.`,
    )

    await update.downloadAndInstall(async (event) => {
      switch (event.event) {
        case 'Started':
          setStatus('updating')
          break
        case 'Finished':
          setStatus('ready')
          break
      }
    })
  }, [])

  return (
    <UpdatesContext value={{ status, relaunch }}>
      {children}
    </UpdatesContext>
  )
}
