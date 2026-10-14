import type { ConnectionParts } from '@tamery/connection/connection-parts'
import {
  DEFAULT_PORTS,
  toConnectionParts,
} from '@tamery/connection/connection-parts'
import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { v7 } from 'uuid'

import { getCollections, mutateOffline } from '~/core/collections'
import { checkOrUpgrade } from '~/core/user/permissions'
import { workspaceSelection } from '~/core/workspace/utils'
import { posthog } from '~/lib/posthog'

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Lives in history state, not the URL: the link can hold a password and the URL is saved as the last location. */
    connectionLink?: string
  }
}

type GuessedParts = ConnectionGuess['parts']

const serverOf = ({
  host,
  port,
  ssh,
  type,
  user,
}: GuessedParts | ConnectionParts) =>
  type &&
  [
    type,
    host?.toLowerCase(),
    port || DEFAULT_PORTS[type],
    user,
    ssh?.host,
  ].join('\n')

const findConnectionId = async (parts: GuessedParts) => {
  const {
    connectionsCollection,
    connectionStringsCollection,
    workspacesCollection,
  } = getCollections()
  const workspace = workspaceSelection.current(workspacesCollection.toArray)
  const candidates = connectionsCollection.toArray.filter(
    (connection) =>
      connection.workspaceId === workspace?.id &&
      connection.type === parts.type &&
      connectionStringsCollection.has(connection.id)
  )
  const servers = await Promise.all(
    candidates.map(async (connection) =>
      serverOf(
        toConnectionParts(
          await connectionStringsCollection.utils.decrypt(connection.id)
        )
      )
    )
  )
  return candidates[servers.indexOf(serverOf(parts))]?.id ?? null
}

const resourceIdOf = (connectionId: string, database: string | undefined) => {
  const { connectionsResourcesCollection, connectionStringsCollection } =
    getCollections()
  const name =
    database ||
    connectionStringsCollection.get(connectionId)?.defaultResourceName ||
    null
  const resource = connectionsResourcesCollection.toArray.find(
    (r) => r.connectionId === connectionId && r.name === name
  )
  if (resource) {
    return resource.id
  }
  const id = v7()
  mutateOffline(() => {
    connectionsResourcesCollection.insert({
      connectionId,
      createdAt: new Date(),
      id,
      name,
      updatedAt: new Date(),
    })
  })
  return id
}

export const useConnectionLinks = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const takeLink = async () => {
      const link = await window.electron?.connectionLinks.take()
      if (!link) {
        return
      }
      const parts = guessConnection(link)?.parts ?? {}
      const connectionId = await findConnectionId(parts)
      posthog.capture('connection_link_opened', { matched: !!connectionId })
      if (connectionId) {
        await navigate({
          params: { resourceId: resourceIdOf(connectionId, parts.database) },
          to: '/connection/$resourceId',
        })
      } else if (
        checkOrUpgrade('connection.create', {
          count: getCollections().connectionsCollection.size,
        })
      ) {
        await navigate({ state: { connectionLink: link }, to: '/create' })
      }
    }
    void takeLink()
    return window.electron?.app.onUrlOpened(takeLink)
  }, [navigate])
}
