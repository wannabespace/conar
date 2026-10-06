import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { toast } from 'sonner'

import { insertQuery } from '~/core/queries/rows/insert'
import { resourceRowsQueryKey } from '~/core/queries/rows/list'
import { setQuery } from '~/core/queries/rows/set'
import { resourceTableTotalQueryKey } from '~/core/queries/rows/total'
import {
  connectionResourceToQueryParams,
  transaction,
} from '~/core/runtime/query'
import type { Draft, NewRow, PrimaryKeys } from '~/core/table/session'
import {
  draftsActions,
  newRowsActions,
  primaryKeysKey,
  stagedActions,
  useTableSessionStore,
} from '~/core/table/session'
import { plural } from '~/lib/plural'
import { queryClient } from '~/lib/query-client'

import { useTableColumnsContext } from './columns'
import { tableGridRef } from './grid-ref'
import { stagedHistory } from './history'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

interface Submitted {
  drafts: Draft[]
  newRows: NewRow[]
}

class SaveError extends Error {
  override name = 'SaveError'
  readonly target:
    | { kind: 'row'; primaryKeys: PrimaryKeys }
    | { kind: 'new'; id: string }

  constructor(cause: unknown, target: SaveError['target']) {
    super(cause instanceof Error ? cause.message : String(cause), { cause })
    this.target = target
  }
}

const failingAs =
  (target: SaveError['target']) =>
  (error: unknown): never => {
    throw new SaveError(error, target)
  }

const updatesOf = (drafts: Draft[]) => {
  const updates = new Map<
    string,
    { primaryKeys: PrimaryKeys; values: Record<string, unknown> }
  >()
  for (const { columnId, primaryKeys, value } of drafts) {
    const key = primaryKeysKey(primaryKeys)
    const update = updates.get(key) ?? { primaryKeys, values: {} }
    update.values[columnId] = value
    updates.set(key, update)
  }
  return updates.values()
}

export const useSaveStaged = ({
  onSaved,
  schema,
  table,
}: {
  onSaved: () => void
  schema: string
  table: string
}) => {
  const { connectionResource } = useRouteContext()
  const sessionStore = useTableSessionStore()
  const { columns } = useTableColumnsContext()
  const history = stagedHistory({ id: connectionResource.id, schema, table })
  const status = stagedActions(sessionStore)

  const mutation = useMutation({
    meta: { event: 'row_changes_saved' },
    mutationFn: async ({ drafts, newRows }: Submitted) => {
      const queryParams =
        await connectionResourceToQueryParams(connectionResource)
      await transaction(queryParams).execute(async (tx) => {
        for (const { primaryKeys, values } of updatesOf(drafts)) {
          // oxlint-disable-next-line no-await-in-loop
          await setQuery({ columns, primaryKeys, schema, table, values })
            .run(queryParams, tx)
            .catch(failingAs({ kind: 'row', primaryKeys }))
        }
        for (const { id, values } of newRows) {
          // oxlint-disable-next-line no-await-in-loop
          await insertQuery({ columns, rows: [values], schema, table })
            .run(queryParams, tx)
            .catch(failingAs({ id, kind: 'new' }))
        }
      })
    },
    onError: (error) => {
      if (error instanceof SaveError) {
        if (error.target.kind === 'row') {
          draftsActions(sessionStore).setRowStatus(error.target.primaryKeys, {
            error: error.message,
          })
        } else {
          newRowsActions(sessionStore).setStatus(error.target.id, {
            error: error.message,
          })
        }
      }
      toast.error('Failed to save changes', {
        description: error.message,
        duration: 6000,
      })
    },
    onMutate: () => status.setStatus({ error: undefined, isCommitting: true }),
    onSettled: () => {
      status.setStatus({ isCommitting: false })
      history.reset()
    },
    onSuccess: async (_, submitted) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: resourceRowsQueryKey({ connectionResource, schema, table }),
        }),
        submitted.newRows.length > 0 &&
          queryClient.invalidateQueries({
            queryKey: resourceTableTotalQueryKey({
              connectionResource,
              schema,
              table,
            }),
          }),
      ])
      status.settle(submitted)
      const rows = new Set(
        submitted.drafts.map((draft) => primaryKeysKey(draft.primaryKeys))
      )
      toast.success(
        `Saved ${plural(rows.size + submitted.newRows.length, 'row')}`
      )
      onSaved()
    },
  })

  return {
    isSaving: mutation.isPending,
    save: () => {
      if (tableGridRef.current?.commit() === false) {
        return
      }
      const { drafts, newRows } = sessionStore.get()
      if (Object.keys(drafts).length > 0 || newRows.length > 0) {
        mutation.mutate({ drafts: Object.values(drafts), newRows })
      }
    },
  }
}
