import { Button } from '@tamery/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@tamery/ui/components/field'
import { Input } from '@tamery/ui/components/input'
import { getRouteApi } from '@tanstack/react-router'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'

import { useCollections } from '~/entities/collections'
import type { Query } from '~/entities/query/sync'

import { linkSavedQuery, useRunnerPageStore } from '../-lib/store'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

type SaveRequest =
  | { kind: 'statement'; sql: string }
  | { kind: 'tab'; sql: string; linked: Query | undefined }
  | { kind: 'rename'; query: Query }

const TITLES: Record<SaveRequest['kind'], string> = {
  rename: 'Rename saved query',
  statement: 'Save statement',
  tab: 'Save tab as query',
}

const DESCRIPTIONS: Record<SaveRequest['kind'], string> = {
  rename: 'Only the name changes. The SQL stays as it was saved.',
  statement:
    'Saves the statement at the caret as a new query. Open it later from Saved in the toolbar.',
  tab: 'Saves everything in this tab as one query for this connection. Open it later from Saved in the toolbar.',
}

const linkedQueryOf = (request: SaveRequest | null) => {
  if (request?.kind === 'tab') {
    return request.linked
  }
  return request?.kind === 'rename' ? request.query : undefined
}

const primaryLabel = (
  request: SaveRequest | null,
  linked: Query | undefined
) => {
  if (request?.kind === 'rename') {
    return 'Rename'
  }
  return linked ? 'Update' : 'Save'
}

const SaveHint = ({
  empty,
  linked,
}: {
  empty: boolean
  linked: Query | undefined
}) => {
  if (empty) {
    return <FieldDescription>There is no SQL to save yet.</FieldDescription>
  }
  if (!linked) {
    return null
  }
  return (
    <FieldDescription>
      This tab was opened from <span data-mask>“{linked.name}”</span>. Update
      it, or save a separate copy.
    </FieldDescription>
  )
}

export const RunnerSaveDialog = ({
  ref,
}: {
  ref: React.RefObject<{ open: (request: SaveRequest) => void } | null>
}) => {
  const { queriesCollection } = useCollections()
  const { connectionResource } = useRouteContext()
  const store = useRunnerPageStore()
  const [request, setRequest] = useState<SaveRequest | null>(null)
  const [name, setName] = useState('')

  useImperativeHandle(ref, () => ({
    open: (next) => {
      setRequest(next)
      if (next.kind === 'rename') {
        setName(next.query.name)
      } else {
        setName(next.kind === 'tab' ? (next.linked?.name ?? '') : '')
      }
    },
  }))

  const sql = request && request.kind !== 'rename' ? request.sql : ''
  const linked = linkedQueryOf(request)
  const empty = request?.kind !== 'rename' && !sql.trim()
  const canConfirm = Boolean(name.trim()) && !empty

  const close = () => setRequest(null)

  const create = () => {
    const id = v7()
    queriesCollection.insert({
      connectionResourceId: connectionResource.id,
      createdAt: new Date(),
      id,
      name: name.trim(),
      query: sql,
      updatedAt: new Date(),
    })
    if (request?.kind === 'tab') {
      linkSavedQuery(store, id)
    }
    toast.success(`Saved "${name.trim()}"`)
    close()
  }

  const update = () => {
    if (!linked) {
      return
    }
    queriesCollection.update(linked.id, (draft) => {
      draft.name = name.trim()
      if (request?.kind === 'tab') {
        draft.query = sql
      }
      draft.updatedAt = new Date()
    })
    toast.success(`Updated "${name.trim()}"`)
    close()
  }

  const primary = linked ? update : create

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{request ? TITLES[request.kind] : ''}</DialogTitle>
          <DialogDescription>
            {request ? DESCRIPTIONS[request.kind] : ''}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="saved-query-name">Name</FieldLabel>
          <Input
            id="saved-query-name"
            data-mask
            value={name}
            placeholder="Active users this week"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canConfirm) {
                primary()
              }
            }}
          />
          <SaveHint
            empty={empty}
            linked={request?.kind === 'tab' ? linked : undefined}
          />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          {linked && request?.kind === 'tab' && (
            <Button variant="outline" disabled={!canConfirm} onClick={create}>
              Save as new
            </Button>
          )}
          <Button disabled={!canConfirm} onClick={primary}>
            {primaryLabel(request, linked)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
