import type { ConnectionParts } from '@tamery/connection/connection-parts'
import { portOf, toConnectionParts } from '@tamery/connection/connection-parts'
import type { ConnectionGuess } from '@tamery/connection/guess'
import { guessConnection } from '@tamery/connection/guess'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { getCollections } from '~/core/collections'
import { findResource } from '~/core/connection/resources'
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

const serverOf = (parts: GuessedParts | ConnectionParts) =>
  parts.type &&
  [
    parts.type,
    parts.host?.toLowerCase(),
    portOf(parts),
    parts.user,
    parts.ssh?.host,
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

/** Never inserts: the link comes from any page the browser opens, so it may only reach a database the user already saved. */
const savedResourceIdOf = (
  connectionId: string,
  database: string | undefined
) => {
  const name =
    database ||
    getCollections().connectionStringsCollection.get(connectionId)
      ?.defaultResourceName ||
    null
  return findResource(connectionId, name)?.id ?? null
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
      const resourceId =
        connectionId && savedResourceIdOf(connectionId, parts.database)
      posthog.capture('connection_link_opened', { matched: !!resourceId })
      if (resourceId) {
        await navigate({
          params: { resourceId },
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
