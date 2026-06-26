import type { ComponentRef } from 'react'
import { RiDeleteBinLine, RiKey2Line, RiMoreLine, RiPauseCircleLine, RiPlayCircleLine } from '@remixicon/react'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tamery/ui/components/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@tamery/ui/components/dropdown-menu'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { Spinner } from '@tamery/ui/components/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@tamery/ui/components/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { format, formatDistanceToNow } from 'date-fns'
import { useRef } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'
import { CreateApiKeyDialog } from './-components/create-api-key-dialog'
import { RevokeApiKeyDialog } from './-components/revoke-api-key-dialog'

export const Route = createLazyFileRoute('/account/api-keys')({
  component: RouteComponent,
})

// eslint-disable-next-line react-refresh/only-export-components
function ApiKeysEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center rounded-xl border
        border-dashed bg-muted/30 px-6 py-14 text-center
      `}
    >
      <div
        className={`
          mb-4 flex size-14 items-center justify-center rounded-full bg-muted
          ring-1 ring-border
        `}
      >
        <RiKey2Line className="size-7 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-base font-semibold tracking-tight">
        No API keys yet
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Key is shown only once. Use as Bearer or
        {' '}
        <code className="
          rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.7rem]
        "
        >
          x-api-key
        </code>
        .
      </p>
      <Button variant="outline" size="sm" onClick={onCreateClick}>
        <RiKey2Line className="size-4" />
        Create a key
      </Button>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const createDialogRef = useRef<ComponentRef<typeof CreateApiKeyDialog>>(null)
  const revokeDialogRef = useRef<ComponentRef<typeof RevokeApiKeyDialog>>(null)

  const {
    data: apiKeys = [],
    isPending,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list()
      if (error)
        throw error
      return data.apiKeys
    },
  })

  const { mutate: setKeyEnabled, isPending: isUpdatingEnabled } = useMutation({
    mutationFn: async ({ keyId, enabled }: { keyId: string, enabled: boolean }) => {
      const { error } = await authClient.apiKey.update({ keyId, enabled })
      if (error)
        throw error
    },
    onSuccess: (_, { enabled }) => {
      refetch()
      toast.success(enabled ? 'API key activated' : 'API key deactivated')
    },
    onError: handleError,
  })

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">API Keys</h2>
        <Button size="sm" onClick={() => createDialogRef.current?.open()}>
          <RiKey2Line className="size-4" />
          Create key
        </Button>
      </div>

      <CreateApiKeyDialog ref={createDialogRef} onRefetch={refetch} />
      <RevokeApiKeyDialog ref={revokeDialogRef} onRefetch={refetch} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Your API keys
            {isFetching && <Spinner className="size-4" />}
          </CardTitle>
          <CardDescription>Revoke any key that is no longer in use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending
            ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )
            : apiKeys.length === 0
              ? <ApiKeysEmptyState onCreateClick={() => createDialogRef.current?.open()} />
              : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name || 'Untitled key'}</TableCell>
                          <TableCell>
                            {key.createdAt
                              ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-default">
                                        {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {format(new Date(key.createdAt), 'MMM d, yyyy h:mm a')}
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              : 'Unknown'}
                          </TableCell>
                          <TableCell className={cn(!key.lastRequest && `
                            text-muted-foreground
                          `)}
                          >
                            {key.lastRequest
                              ? formatDistanceToNow(new Date(key.lastRequest), { addSuffix: true })
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {key.enabled === false ? 'Disabled' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={<Button variant="ghost" size="icon-sm" aria-label="Key actions" />}
                                >
                                  <RiMoreLine className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {key.enabled === false
                                    ? (
                                        <DropdownMenuItem
                                          disabled={isUpdatingEnabled}
                                          onClick={() => setKeyEnabled({ keyId: key.id, enabled: true })}
                                        >
                                          <RiPlayCircleLine className="size-4" />
                                          Activate
                                        </DropdownMenuItem>
                                      )
                                    : (
                                        <DropdownMenuItem
                                          disabled={isUpdatingEnabled}
                                          onClick={() => setKeyEnabled({ keyId: key.id, enabled: false })}
                                        >
                                          <RiPauseCircleLine className="size-4" />
                                          Deactivate
                                        </DropdownMenuItem>
                                      )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => revokeDialogRef.current?.revoke(key.id)}
                                  >
                                    <RiDeleteBinLine className="size-4" />
                                    Revoke
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
        </CardContent>
      </Card>
    </>
  )
}
