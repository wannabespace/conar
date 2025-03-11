import { Button } from '@connnect/ui/components/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@connnect/ui/components/tooltip'
import { RiLoader4Line } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createContext, use, useEffect, useMemo, useState } from 'react'

export type UpdatesStatus = 'no-updates' | 'checking' | 'downloading' | 'ready' | 'error'

const UpdatesContext = createContext<{
  status: UpdatesStatus
  message?: string
  relaunch: () => Promise<void>
  checkForUpdates: () => Promise<void>
}>(null!)

// eslint-disable-next-line react-refresh/only-export-components
export const useUpdates = () => use(UpdatesContext)

export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<UpdatesStatus>('no-updates')
  const [message, setMessage] = useState<string | undefined>(undefined)

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

  async function relaunch() {
    await window.electron.app.quitAndInstall()
  }

  const value = useMemo(() => ({ status, message, checkForUpdates, relaunch }), [status, message])

  return (
    <UpdatesContext value={value}>
      {children}
    </UpdatesContext>
  )
}

export function UpdatesButton() {
  const { status, checkForUpdates, relaunch, message } = useUpdates()
  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: () => window.electron.versions.app(),
  })

  return (
    <>
      {(status === 'no-updates' || status === 'checking') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger disabled={status === 'checking'} asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-xs opacity-50 cursor-pointer"
                disabled={status === 'checking'}
                onClick={() => checkForUpdates()}
              >
                {status === 'checking' && <RiLoader4Line className="size-3 animate-spin" />}
                v
                {version}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Click to check for updates
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {status === 'downloading' && (
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
            <TooltipTrigger
              className="text-xs opacity-50 text-destructive cursor-pointer"
              onClick={() => checkForUpdates()}
            >
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
