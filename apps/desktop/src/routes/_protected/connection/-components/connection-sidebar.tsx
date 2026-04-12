import type { LinkProps } from '@tanstack/react-router'
import { getOS } from '@conar/shared/utils/os'
import { AppLogo } from '@conar/ui/components/brand/app-logo'
import { Button } from '@conar/ui/components/button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { ThemeToggle } from '@conar/ui/components/custom/theme-toggle'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogTitle, DialogTrigger } from '@conar/ui/components/dialog'
import { Label } from '@conar/ui/components/label'
import { ScrollArea } from '@conar/ui/components/scroll-area'
import { Separator } from '@conar/ui/components/separator'
import { Textarea } from '@conar/ui/components/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCommandLine, RiFileListLine, RiMessageLine, RiMoonLine, RiNodeTree, RiPlayLargeLine, RiShieldCheckLine, RiSunLine, RiTableLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { Link, useMatches, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { getConnectionResourceStore } from '~/entities/connection/store'
import { UserButton } from '~/entities/user/components'
import { orpc } from '~/lib/orpc'
import { appStore } from '~/store'
import { Route } from '../$resourceId'

const os = getOS(navigator.userAgent)

function baseClasses(isActive = false) {
  return cn(
    `
      flex size-9 cursor-pointer items-center justify-center rounded-md border
      border-transparent text-foreground
    `,
    isActive && `
      border-primary/20 bg-primary/10 text-primary
      hover:bg-primary/20
    `,
  )
}

function SupportButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const { mutate: sendSupport, isPending: loading } = useMutation(orpc.contact.mutationOptions({
    onSuccess: () => {
      toast.success('Support message sent successfully! We will get back to you as soon as possible.')
      setOpen(false)
      setMessage('')
    },
    onError: (err) => {
      console.error(err)
      toast.error('Failed to send message. Please try again later.')
    },
  }))

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    sendSupport({ message })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger render={<Button size="icon" variant="ghost" />}>
            <RiMessageLine className="size-4" />
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Support</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Have a question, suggestion, or need assistance?
            We're here to listen!
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
              placeholder="Type any message you'd like to send us"
              className="min-h-48"
            />
          </form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit" disabled={loading || !message}>
            <LoadingContent loading={loading}>
              Send
            </LoadingContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MainLinks() {
  const { connectionResource } = Route.useRouteContext()
  const { schema: schemaParam, table: tableParam } = useSearch({ strict: false })
  const match = useMatches({
    select: matches => matches.map(match => match.routeId).at(-1),
  })
  const store = getConnectionResourceStore(connectionResource.id)
  const lastOpenedTable = useSubscription(store, { selector: state => state.lastOpenedTable })

  useEffect(() => {
    if (tableParam && schemaParam && tableParam !== lastOpenedTable?.table && schemaParam !== lastOpenedTable?.schema) {
      store.set(state => ({
        ...state,
        lastOpenedTable: { schema: schemaParam, table: tableParam },
      } satisfies typeof state))
    }
  }, [store, lastOpenedTable, tableParam, schemaParam])

  const isActiveSql = match === '/_protected/connection/$resourceId/query/'
  const isActiveTables = match === '/_protected/connection/$resourceId/table/'
  const isActiveDefinitions = match?.includes('/_protected/connection/$resourceId/definitions')
  const isActiveVisualizer = match === '/_protected/connection/$resourceId/visualizer/'

  const isCurrentTableAsLastOpened = lastOpenedTable?.schema === schemaParam && lastOpenedTable?.table === tableParam

  const route = useMemo(() => {
    if (!isCurrentTableAsLastOpened && lastOpenedTable) {
      return {
        to: '/connection/$resourceId/table',
        params: { resourceId: connectionResource.id },
        search: { schema: lastOpenedTable.schema, table: lastOpenedTable.table },
      } satisfies LinkProps
    }

    return { to: '/connection/$resourceId/table', params: { resourceId: connectionResource.id } } satisfies LinkProps
  }, [connectionResource.id, isCurrentTableAsLastOpened, lastOpenedTable])

  function onTablesClick() {
    if (isCurrentTableAsLastOpened && lastOpenedTable) {
      store.set(state => ({
        ...state,
        lastOpenedTable: null,
      } satisfies typeof state))
    }
  }

  const lastOpenedChatId = useSubscription(store, { selector: state => state.lastOpenedChatId })

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/connection/$resourceId/query"
            params={{ resourceId: connectionResource.id }}
            search={{
              ...(lastOpenedChatId ? { chatId: lastOpenedChatId } : {}),
            }}
            className={baseClasses(isActiveSql)}
          >
            <RiPlayLargeLine className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">SQL Runner</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            className={baseClasses(isActiveTables)}
            {...route}
            onClick={() => {
              onTablesClick()
            }}
          >
            <RiTableLine className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Tables</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/connection/$resourceId/definitions"
            params={{ resourceId: connectionResource.id }}
            className={baseClasses(isActiveDefinitions)}
          >
            <RiShieldCheckLine className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Definitions</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/connection/$resourceId/visualizer"
            params={{ resourceId: connectionResource.id }}
            className={baseClasses(isActiveVisualizer)}
          >
            <RiNodeTree className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">Visualizer</TooltipContent>
      </Tooltip>
    </>
  )
}

export function ConnectionSidebar({ className, ...props }: React.ComponentProps<'div'>) {
  const { connectionResource } = Route.useRouteContext()
  const store = getConnectionResourceStore(connectionResource.id)

  return (
    <div className={cn('flex flex-col items-center', className)} {...props}>
      <div className="flex flex-col p-4 pb-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/"
              className="p-2"
            >
              <AppLogo className="size-6 text-primary" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Dashboard</TooltipContent>
        </Tooltip>
      </div>
      <ScrollArea className="relative flex flex-1 flex-col items-center gap-2">
        <div className="w-full p-4">
          <div className="flex w-full flex-col">
            <MainLinks />
          </div>
        </div>
      </ScrollArea>
      <div className="flex flex-col items-center p-4 pt-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => store.set(state => ({ ...state, loggerOpened: !state.loggerOpened } satisfies typeof state))}
            >
              <RiFileListLine className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Query Logger</TooltipContent>
        </Tooltip>
        <Separator className="my-4" />
        <SupportButton />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => appStore.set(state => ({ ...state, isActionCenterOpen: true } satisfies typeof state))}
            >
              <RiCommandLine className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {os?.type === 'macos' ? '⌘' : 'Ctrl'}
            P
          </TooltipContent>
        </Tooltip>
        <ThemeToggle render={<Button size="icon" variant="ghost" />}>
          <RiSunLine className={`
            size-4
            dark:hidden
          `}
          />
          <RiMoonLine className={`
            hidden size-4
            dark:block
          `}
          />
        </ThemeToggle>
        <div className="mt-2">
          <UserButton />
        </div>
      </div>
    </div>
  )
}
