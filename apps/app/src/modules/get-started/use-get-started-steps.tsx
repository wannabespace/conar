import {
  McpServerIcon,
  PlusSignIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useLiveQuery } from '@tanstack/react-db'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useSubscription } from 'seitu/react'

import { useCollections } from '~/core/collections'
import { lastOpenedResourcesStorageValue } from '~/core/connection/last-opened-resources'
import { ShortcutKbd } from '~/core/keyboard/shortcut-kbd'
import { actionCenterOpen } from '~/modules/actions-center/action-center-open'
import {
  MCP_CLIENTS_REFETCH_INTERVAL,
  mcpClientsQuery,
} from '~/modules/mcp/use-mcp-server'
import { newQueryAction } from '~/modules/runner/lib/new-query'

import { getStarted } from './progress'

export interface GetStartedStep {
  action: { icon: IconSvgElement; label: string } & (
    | { run: () => unknown }
    | { blocked: string }
  )
  description: ReactNode
  done: boolean
  id: string
  title: string
}

export const useGetStartedSteps = () => {
  const { connectionsCollection } = useCollections()
  const { data: connections } = useLiveQuery({
    query: (q) => q.from({ c: connectionsCollection }),
  })
  const { dismissed, done } = useSubscription(getStarted.progress)
  const [lastOpened] = useSubscription(lastOpenedResourcesStorageValue)
  const { resourceId } = useParams({ strict: false })
  const target = resourceId ?? lastOpened ?? null
  const { data: agents } = useQuery({
    ...mcpClientsQuery,
    enabled: !!window.electron && !dismissed,
    refetchInterval: (query) =>
      query.state.data?.length ? false : MCP_CLIENTS_REFETCH_INTERVAL,
  })
  const router = useRouter()

  const hasConnection = connections.length > 0
  const inConnection = (
    run: (target: string) => unknown
  ): { run: () => unknown } | { blocked: string } => {
    if (target) {
      return { run: () => run(target) }
    }
    return {
      blocked: hasConnection
        ? 'Open a connection first.'
        : 'Add a connection first.',
    }
  }

  const steps: GetStartedStep[] = [
    {
      action: {
        icon: PlusSignIcon,
        label: 'New connection',
        run: () => router.navigate({ to: '/create' }),
      },
      description: 'Paste a connection string and Tamery fills in the rest.',
      done: hasConnection,
      id: 'connection',
      title: 'Add a connection',
    },
    {
      action: {
        icon: Search01Icon,
        label: 'Find a table',
        ...inConnection(async (id) => {
          if (id !== resourceId) {
            await router.navigate({
              params: { resourceId: id },
              to: '/connection/$resourceId',
            })
          }
          actionCenterOpen.set(true)
        }),
      },
      description:
        'Pick one in the Navigator. Edits stay drafts until you save them.',
      done: done.includes('table'),
      id: 'table',
      title: 'Open a table',
    },
    {
      action: {
        icon: newQueryAction.icon,
        label: newQueryAction.label,
        ...inConnection((id) =>
          router.navigate({
            params: { resourceId: id, tabId: newQueryAction.open(id) },
            to: '/connection/$resourceId/$tabId',
          })
        ),
      },
      description: (
        <>
          Write SQL and run it with <ShortcutKbd shortcut="runStatement" />.
        </>
      ),
      done: done.includes('query'),
      id: 'query',
      title: 'Run a query',
    },
  ]

  if (window.electron) {
    steps.push({
      action: {
        icon: McpServerIcon,
        label: 'Set up',
        run: () =>
          router.navigate({
            params: { section: 'mcp' },
            to: '/settings/$section',
          }),
      },
      description:
        'Let Claude Code, Codex or Cursor query your databases over MCP.',
      done: !!agents?.length,
      id: 'agent',
      title: 'Connect your AI agent',
    })
  }

  return { dismissed, steps }
}
