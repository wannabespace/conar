import { relaunch } from '@tauri-apps/plugin-process'
import { check } from '@tauri-apps/plugin-updater'
import { createContext, use, useState } from 'react'
import { toast } from 'sonner'
import { env } from './env'
import { useAsyncEffect } from './hooks/use-async-effect'

const UpdatesContext = createContext<{
  isUpdating: boolean
  canRelaunch: boolean
  relaunch: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [isUpdating, setUpdating] = useState(false)
  const [canRelaunch, setCanRelaunch] = useState(false)

  useAsyncEffect(async () => {
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

    await update.download(async (event) => {
      switch (event.event) {
        case 'Started':
          setUpdating(true)
          toast.info(`started downloading ${event.data.contentLength} bytes`)
          break
        case 'Finished':
          toast.info('download finished')
          setUpdating(false)
          break
      }
    })
    await update.install()
    setCanRelaunch(true)
  }, [])

  return (
    <UpdatesContext
      value={{ isUpdating, canRelaunch, relaunch }}
    >
      {children}
    </UpdatesContext>
  )
}
