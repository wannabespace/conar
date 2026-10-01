import { CONNECTION_RESOURCE_ROOT_SYMBOL } from '@tamery/shared/constants'
import { SafeURL } from '@tamery/shared/safe-url'
import { Button } from '@tamery/ui/components/button'
import { copy } from '@tamery/ui/lib/copy'
import { cn } from '@tamery/ui/lib/utils'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { MotionStyle } from 'motion/react'
import { motion } from 'motion/react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { AppContextMenu, AppMenuButton } from '~/components/app-context-menu'
import { useCollections } from '~/core/collections'
import { ConnectionResourceLink } from '~/core/connection/connection-resource-link'
import { useFetchingConfig } from '~/core/connection/fetching'
import { getConnectionStore } from '~/core/connection/stores'
import type { Connection } from '~/core/connection/sync'
import { connectionResourcesQueryOptions } from '~/core/queries/connection/resources'
import { openNewWindow } from '~/lib/new-window'

import { ConnectionCardMeta } from './connection-card-meta'
import { ConnectionCardStatus } from './connection-card-status'
import { ConnectionIconWithVersion } from './connection-icon-with-version'
import { buildConnectionMenuItems } from './connection-menu-items'

export const ConnectionCard = ({
  connection,
  onRemove,
}: {
  connection: Connection
  onRemove: VoidFunction
}) => {
  const router = useRouter()
  const { connectionStringsCollection, connectionsResourcesCollection } =
    useCollections()
  const { data: connectionString } = useLiveQuery({
    query: (q) =>
      q
        .from({ cs: connectionStringsCollection })
        .where(({ cs }) => eq(cs.connectionId, connection.id))
        .findOne(),
  })
  const { data: connectionResources } = useLiveQuery({
    query: (q) =>
      q
        .from({ cr: connectionsResourcesCollection })
        .where(({ cr }) => eq(cr.connectionId, connection.id))
        .orderBy(({ cr }) => cr.name, 'asc'),
  })

  const connectionResourcesNames = connectionResources.map(
    (r) => r.name || CONNECTION_RESOURCE_ROOT_SYMBOL
  )
  const { type: fetchType, canSend, reason } = useFetchingConfig(connection)

  const {
    data: resources = connectionResourcesNames,
    isFetching,
    error,
    refetch,
  } = useQuery({
    ...connectionResourcesQueryOptions(connection),
    enabled: canSend,
  })
  const refresh = useMutation({ mutationFn: () => refetch() })

  const defaultResourceName = connectionString?.defaultResourceName ?? null

  const connectionStore = getConnectionStore(connection.id)
  const selectedResourceName = useSubscription(connectionStore, {
    selector: (state) =>
      (state.lastOpenedResourceName ||
        defaultResourceName ||
        resources[0] ||
        null) as string | typeof CONNECTION_RESOURCE_ROOT_SYMBOL | null,
  })
  const resolvedSelectedResourceName =
    selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL
      ? null
      : selectedResourceName
  const selectedResource = connectionResources.find(
    (r) => r.name === resolvedSelectedResourceName
  )
  const canOpenResource =
    canSend || (fetchType === 'waiting-for-password' && !!window.electron)

  const handleCopy = async () => {
    const decryptedString = await connectionStringsCollection.utils.decrypt(
      connection.id
    )

    const connectionStringToCopy = new SafeURL(decryptedString)
    connectionStringToCopy.pathname =
      selectedResourceName === CONNECTION_RESOURCE_ROOT_SYMBOL ||
      selectedResourceName === null
        ? ''
        : selectedResourceName

    copy(connectionStringToCopy.toString(), 'Connection string copied')
  }

  const handleClearPassword = async () => {
    const record = connectionStringsCollection.get(connection.id)
    if (!record) {
      return
    }

    const url = new SafeURL(
      await connectionStringsCollection.utils.decrypt(connection.id)
    )
    url.password = ''

    const connectionStringRecord =
      await connectionStringsCollection.utils.prepare({
        connectionId: connection.id,
        connectionString: url.toString(),
        updatedAt: record.updatedAt,
      })

    connectionStringsCollection.update(connection.id, (draft) => {
      Object.assign(draft, connectionStringRecord)
    })

    toast.success('Password cleared from this device')
  }

  const isResourcesShown = resources.length > 1
  const isLoadingVisible =
    (isFetching && connectionResourcesNames.length === 0) || refresh.isPending

  const items = buildConnectionMenuItems({
    canSend,
    connection,
    isPasswordPopulated: connectionString?.isPasswordPopulated,
    onClearPassword: handleClearPassword,
    onCopy: handleCopy,
    onOpenInNewWindow:
      selectedResource && canOpenResource
        ? () =>
            openNewWindow(
              router.buildLocation({
                params: { resourceId: selectedResource.id },
                to: '/connection/$resourceId',
              }).href
            )
        : null,
    onRefresh: () => refresh.mutate(),
    onRemove,
  })

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      style={
        (connection.color ? { '--color': connection.color } : {}) as MotionStyle
      }
      className="relative flex flex-col border-b last:border-b-0"
    >
      <AppContextMenu
        items={items}
        contentProps={{ className: 'min-w-44' }}
        render={
          <div
            className={cn(
              'group relative flex h-9 items-center gap-3 pr-2 pl-3 select-none',
              selectedResource &&
                canOpenResource &&
                'hover:bg-accent has-[[data-resource-link]:hover]:bg-accent'
            )}
          />
        }
      >
        {selectedResource && canOpenResource && (
          <ConnectionResourceLink
            resourceId={selectedResource.id}
            className="absolute inset-0 cursor-default"
            preload={false}
            data-resource-link
          />
        )}
        {connection.color && (
          <span className="pointer-events-none absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-(--color)" />
        )}
        <div
          className={cn(
            'pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3',
            isLoadingVisible && 'animate-pulse'
          )}
        >
          <ConnectionIconWithVersion connection={connection} />
          <div className="flex min-w-0 items-center gap-2">
            <span
              data-mask
              title={connection.name}
              className="truncate text-sm leading-none"
            >
              {connection.name}
            </span>
            <ConnectionCardStatus
              canSend={canSend}
              error={error}
              isLoadingVisible={isLoadingVisible}
              reason={reason}
            />
          </div>
        </div>
        <ConnectionCardMeta
          canSend={canSend}
          connectionStore={connectionStore}
          displayUrl={connectionString?.displayUrl}
          isResourcesShown={isResourcesShown}
          resources={resources}
          selectedResourceName={selectedResourceName}
        />
        <AppMenuButton
          items={items}
          contentProps={{ className: 'min-w-44' }}
          render={<Button variant="ghost-row" size="icon-xs" />}
          className="relative z-10"
        />
      </AppContextMenu>
    </motion.div>
  )
}
