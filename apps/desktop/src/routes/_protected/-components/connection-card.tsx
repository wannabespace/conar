import type { connections } from '~/drizzle'
import { SafeURL } from '@conar/shared/utils/safe-url'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@conar/ui/components/dropdown-menu'
import { copy } from '@conar/ui/lib/copy'
import { cn } from '@conar/ui/lib/utils'
import { RiArrowDownSLine, RiArrowUpSLine, RiCloseLine, RiDatabase2Line, RiDeleteBinLine, RiEditLine, RiFileCopyLine, RiLoader4Line, RiMoreLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ConnectionIcon } from '~/entities/connection/components'
import { useConnectionLinkParams, useServerConnections } from '~/entities/connection/hooks'
import { connectionsCollection } from '~/entities/connection/sync'
import { cloneConnectionForConnection } from '~/entities/connection/utils'

export function ConnectionCard({ connection, onRemove, onRename, onClose }: { connection: typeof connections.$inferSelect, onRemove: VoidFunction, onRename: VoidFunction, onClose?: VoidFunction }) {
  const url = new SafeURL(connection.connectionString)

  if (connection.isPasswordExists || url.password) {
    url.password = '*'.repeat(url.password.length || 6)
  }

  const connectionString = url.toString()

  const params = useConnectionLinkParams(connection.id)

  const { connectionNamesList, isLoading, isExpanded, toggleExpand } = useServerConnections(connection)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ duration: 0.15 }}
      className="group relative"
    >
      {onClose && (
        <Button
          variant="outline"
          size="icon-xs"
          className="
            absolute -top-1.5 -right-1.5 z-10 rounded-full bg-card! opacity-0
            duration-75
            group-hover:opacity-100
          "
          onClick={() => onClose()}
        >
          <RiCloseLine className="size-3.5" />
        </Button>
      )}
      <Link
        className={cn(
          `
            group relative flex items-center justify-between gap-4
            overflow-hidden rounded-lg border border-l-4 border-border/50
            bg-muted/30 p-5
          `,
          connection.color
            ? `
              border-l-(--color)/60
              hover:border-(--color)/60
            `
            : 'hover:border-primary/60',
        )}
        style={connection.color ? { '--color': connection.color } : {}}
        preload={false}
        {...params}
      >
        <div className="size-12 shrink-0 rounded-lg bg-muted/70 p-3">
          <ConnectionIcon
            type={connection.type}
            className="size-full"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={`
            flex items-center gap-2 truncate font-medium tracking-tight
          `}
          >
            <span className={connection.color
              ? `
                text-(--color)
                group-hover:text-(--color)/80
              `
              : ''}
            >
              {connection.name}
            </span>
            {connection.label && (
              <Badge variant="secondary">
                {connection.label}
              </Badge>
            )}
          </div>
          <div
            data-mask
            className="truncate font-mono text-xs text-muted-foreground"
          >
            {connectionString.replaceAll('*', '•')}
          </div>
        </div>

        <div className="z-10 flex items-center gap-1">
          {connectionNamesList.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleExpand()
              }}
            >
              {isExpanded
                ? <RiArrowUpSLine className="size-4" />
                : (
                    <RiArrowDownSLine className="size-4" />
                  )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className={`
              rounded-md p-2
              hover:bg-accent-foreground/5
            `}
            >
              <RiMoreLine className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  copy(connection.connectionString, 'Connection string copied to clipboard')
                }}
              >
                <RiFileCopyLine className="size-4 opacity-50" />
                Copy Connection String
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                }}
              >
                <RiEditLine className="size-4 opacity-50" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className={`
                  text-destructive
                  focus:text-destructive
                `}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
              >
                <RiDeleteBinLine className="size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Link>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`
              mx-4 flex max-h-60 flex-col gap-1 overflow-y-auto rounded-lg
              border bg-muted/30 p-2
            `}
            >
              {isLoading
                ? (
                    <div className={`
                      flex items-center gap-2 p-2 text-sm text-muted-foreground
                    `}
                    >
                      <RiLoader4Line className="size-4 animate-spin" />
                      Loading databases...
                    </div>
                  )
                : connectionNamesList.length > 0
                  ? (
                      connectionNamesList.map(connectionName => (
                        <div
                          key={connectionName}
                          role="button"
                          tabIndex={0}
                          className={`
                            flex cursor-pointer items-center gap-2 rounded-md
                            border border-transparent p-2 text-sm
                            hover:border-border hover:bg-muted
                          `}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            try {
                              const newConnection = cloneConnectionForConnection(connection, connectionName)
                              connectionsCollection.insert(newConnection)
                            }
                            catch (error) {
                              console.error(`Failed to open server connection ${connectionName} for this connection ${connection.name} with error ${error instanceof Error ? error.message : error}`)
                            }
                          }}
                        >
                          <RiDatabase2Line className={`
                            size-4 text-muted-foreground
                          `}
                          />
                          <span>{connectionName}</span>
                        </div>
                      ))
                    )
                  : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No other databases found.
                      </div>
                    )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
