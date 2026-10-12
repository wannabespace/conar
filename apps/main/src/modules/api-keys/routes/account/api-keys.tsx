import {
  Delete02Icon,
  Key01Icon,
  MoreHorizontalIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '@tamery/ui/components/badge'
import { Button } from '@tamery/ui/components/button'
import { cardClass } from '@tamery/ui/components/card.utils'
import {
  SettingsGroup,
  SettingsRow,
} from '@tamery/ui/components/custom/settings-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@tamery/ui/components/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@tamery/ui/components/empty'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import type { ComponentRef } from 'react'
import { useRef } from 'react'
import { toast } from 'sonner'

import { AccountPage } from '~/components/account-page'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

import { CreateApiKeyDialog } from '../../create-api-key-dialog'
import { RevokeApiKeyDialog } from '../../revoke-api-key-dialog'

const SKELETON_ROWS = 2

const ago = (date: Date | string) =>
  formatDistanceToNow(new Date(date), { addSuffix: true })

const RouteComponent = () => {
  const createDialogRef = useRef<ComponentRef<typeof CreateApiKeyDialog>>(null)
  const revokeDialogRef = useRef<ComponentRef<typeof RevokeApiKeyDialog>>(null)

  const {
    data: apiKeys = [],
    isPending,
    refetch,
  } = useQuery({
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list()
      if (error) {
        throw error
      }
      return data.apiKeys
    },
    queryKey: ['api-keys'],
  })

  const { mutate: setKeyEnabled, isPending: isUpdatingEnabled } = useMutation({
    mutationFn: async ({
      keyId,
      enabled,
    }: {
      keyId: string
      enabled: boolean
    }) => {
      const { error } = await authClient.apiKey.update({ enabled, keyId })
      if (error) {
        throw error
      }
    },
    onError: handleError,
    onSuccess: (_, { enabled }) => {
      refetch()
      toast.success(enabled ? 'API key activated' : 'API key deactivated')
    },
  })

  const createButton = (
    <Button size="sm" onClick={() => createDialogRef.current?.open()}>
      Create key
    </Button>
  )

  return (
    <AccountPage title="API keys" action={apiKeys.length > 0 && createButton}>
      <CreateApiKeyDialog ref={createDialogRef} onRefetch={refetch} />
      <RevokeApiKeyDialog ref={revokeDialogRef} onRefetch={refetch} />
      {!isPending && apiKeys.length === 0 ? (
        <div className={cardClass}>
          <Empty size="sm">
            <EmptyHeader>
              <EmptyMedia variant="muted">
                <HugeiconsIcon icon={Key01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No API keys yet</EmptyTitle>
              <EmptyDescription>
                A key is shown once, when you create it. Send it as a Bearer
                token or in the <code className="font-mono">x-api-key</code>{' '}
                header.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{createButton}</EmptyContent>
          </Empty>
        </div>
      ) : (
        <SettingsGroup>
          {isPending
            ? Array.from({ length: SKELETON_ROWS }, (_, row) => (
                <SettingsRow
                  key={row}
                  title={<Skeleton className="h-4 w-32" />}
                />
              ))
            : apiKeys.map((key) => (
                <SettingsRow
                  key={key.id}
                  title={
                    <span className="flex items-center gap-2">
                      <span data-mask>{key.name || 'Untitled key'}</span>
                      {key.enabled === false && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </span>
                  }
                  description={`Created ${key.createdAt ? ago(key.createdAt) : 'at an unknown time'}, ${key.lastRequest ? `last used ${ago(key.lastRequest)}` : 'never used'}`}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost-muted"
                          size="icon-sm"
                          aria-label="Key actions"
                        />
                      }
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        strokeWidth={2}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={isUpdatingEnabled}
                        onClick={() =>
                          setKeyEnabled({
                            enabled: key.enabled === false,
                            keyId: key.id,
                          })
                        }
                      >
                        <HugeiconsIcon
                          icon={
                            key.enabled === false
                              ? PlayCircleIcon
                              : PauseCircleIcon
                          }
                          strokeWidth={2}
                        />
                        {key.enabled === false ? 'Activate' : 'Deactivate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => revokeDialogRef.current?.revoke(key.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SettingsRow>
              ))}
        </SettingsGroup>
      )}
    </AccountPage>
  )
}

export const Route = createLazyFileRoute('/account/api-keys')({
  component: RouteComponent,
})
