import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { useLocalStorageValue } from '@react-hookz/web'
import { RiLoader4Line } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAsyncEffect } from './hooks/use-async-effect'

export type UpdatesStatus = 'no-updates' | 'checking' | 'updating' | 'ready' | 'error'

const UpdatesContext = createContext<{
  status: UpdatesStatus
  message?: string
  relaunch: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UpdatesStatus>('no-updates')
  const [message, setMessage] = useState<string | undefined>(undefined)
  const { value: lastCheck, set: setLastCheck } = useLocalStorageValue<string | undefined>('last-update-check')

  useEffect(() => {
    window.electron.app.onUpdatesStatus(({ status, message }) => {
      setStatus(status)
      setMessage(message)
    })
  }, [])

  useAsyncEffect(async () => {
    const currentAppVersion = await window.electron.versions.app()
    const interval = setInterval(() => {
      const checkedAppVersion = lastCheck?.split('/')[0]
      const lastCheckDate = lastCheck?.split('/')[1]

      if (checkedAppVersion && currentAppVersion !== checkedAppVersion) {
        setLastCheck(undefined)
      }

      if (!lastCheckDate || dayjs().diff(dayjs(lastCheckDate), 'minutes') > 30) {
        if (import.meta.env.PROD) {
          window.electron.app.checkForUpdates()
        }
        setLastCheck(`${currentAppVersion}/${dayjs().toISOString()}`)
      }
    }, 1000)

    return () => clearInterval(interval)
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

  const value = useMemo(() => ({ status, message, relaunch }), [status, message])

  return (
    <UpdatesContext value={value}>
      {children}
    </UpdatesContext>
  )
}

export function UpdatesButton() {
  const { status, relaunch, message } = useUpdates()
  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: () => window.electron.versions.app(),
  })

  return (
    <>
      {(status === 'no-updates' || status === 'checking') && (
        <span className="flex items-center gap-2 text-xs opacity-50">
          {status === 'checking' && <RiLoader4Line className="size-3 animate-spin" />}
          v
          {version}
        </span>
      )}
      {status === 'updating' && (
        <div className="flex items-center gap-2 opacity-50">
          <RiLoader4Line className="size-3 animate-spin" />
          <span className="text-xs">
            Downloading update...
          </span>
        </div>
      )}
      {status === 'ready' && (
        <Button variant="outline" size="xs" onClick={relaunch}>
          Restart to update
        </Button>
      )}
      {status === 'error' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-xs opacity-50 text-destructive">
              Update failed
            </TooltipTrigger>
            <TooltipContent>
              {message}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  )
}
