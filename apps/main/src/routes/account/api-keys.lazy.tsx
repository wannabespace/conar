import type { ComponentRef } from 'react'
import type { CreatedApiKey } from './-components/create-api-key-dialog'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@conar/ui/components/card'
import { CopyButton } from '@conar/ui/components/custom/copy-button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@conar/ui/components/input-group'
import { Skeleton } from '@conar/ui/components/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@conar/ui/components/table'
import { RiDeleteBinLine, RiKey2Line } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
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
        Secret is shown once. Use as Bearer or
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
function CreatedKeyBanner({ apiKey, onClose }: { apiKey: CreatedApiKey, onClose: () => void }) {
  return (
    <div className="
      rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4
    "
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <RiKey2Line className="size-4 text-emerald-500" />
        New API key created
      </div>
      <p className="mb-2 text-xs text-muted-foreground">
        This key is shown only once. Copy and store it safely.
      </p>
      <div className="mb-3 min-w-0">
        <InputGroup className="font-mono text-xs shadow-none">
          <InputGroupInput
            readOnly
            value={apiKey.key}
            className="min-w-0 overflow-x-auto font-mono text-xs"
          />
          <InputGroupAddon align="inline-end">
            <CopyButton
              text={apiKey.key}
              variant="ghost"
              size="icon-xs"
              aria-label="Copy API key"
              onClick={() => toast.success('API key copied')}
            />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={onClose}>Done</Button>
      </div>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const createDialogRef = useRef<ComponentRef<typeof CreateApiKeyDialog>>(null)
  const revokeDialogRef = useRef<ComponentRef<typeof RevokeApiKeyDialog>>(null)
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null)

  const {
    data: apiKeys = [],
    isPending,
    refetch,
  } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list()
      if (error)
        throw error
      return data.apiKeys
    },
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

      <CreateApiKeyDialog
        ref={createDialogRef}
        onCreated={setCreatedKey}
        onRefetch={refetch}
      />
      <RevokeApiKeyDialog ref={revokeDialogRef} onRefetch={refetch} />

      <Card>
        <CardHeader>
          <CardTitle>Your API keys</CardTitle>
          <CardDescription>Revoke any key that is no longer in use.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {createdKey && (
            <CreatedKeyBanner
              apiKey={createdKey}
              onClose={() => setCreatedKey(null)}
            />
          )}
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
                        <TableHead>Prefix</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map(key => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name || 'Untitled key'}</TableCell>
                          <TableCell className="font-mono text-xs">{key.start || key.prefix || 'n/a'}</TableCell>
                          <TableCell>
                            {key.createdAt
                              ? formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })
                              : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.enabled === false ? 'secondary' : 'outline'}>
                              {key.enabled === false ? 'Disabled' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeDialogRef.current?.revoke(key.id)}
                              >
                                <RiDeleteBinLine className="size-4" />
                                Revoke
                              </Button>
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
