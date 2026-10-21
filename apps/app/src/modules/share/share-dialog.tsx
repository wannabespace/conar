import { Button } from '@tamery/ui/components/button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { useIsMutating } from '@tanstack/react-query'
import { useState } from 'react'

import { orpc } from '~/lib/orpc'
import { sharesUrl } from '~/lib/urls'

import { ShareLinkField } from './share-link'
import { SHARE_FORM_ID, ShareLinkForm } from './share-link-form'
import { useShareView } from './use-share-view'
import { sameShareView, useTableShare } from './use-table-share'

/** Goes inside `Dialog`, never around it: the first link is picked once, when the content mounts on open. */
export const ShareDialog = ({
  schema,
  table,
}: {
  schema: string
  table: string
}) => {
  const { shares } = useTableShare(schema, table)
  const view = useShareView(schema, table)
  const [linkId, setLinkId] = useState<string | null>(
    () => shares.find((entry) => sameShareView(entry.view, view))?.id ?? null
  )
  const saving =
    useIsMutating({ mutationKey: orpc.shares.save.mutationKey() }) > 0
  const share = shares.find(({ id }) => id === linkId) ?? null
  const linkItems = [
    ...shares.map(({ id, name }) => ({ label: name, value: id })),
    { label: 'New link', value: null },
  ]

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{share ? 'Shared table' : 'Share table'}</DialogTitle>
        <DialogDescription data-mask>{`${schema}.${table}`}</DialogDescription>
      </DialogHeader>
      {shares.length > 0 && (
        <Select items={linkItems} value={linkId} onValueChange={setLinkId}>
          <SelectTrigger aria-label="Shared links">
            <SelectValue data-mask />
          </SelectTrigger>
          <SelectContent>
            {shares.map(({ id, name }) => (
              <SelectItem key={id} value={id}>
                <span data-mask>{name}</span>
              </SelectItem>
            ))}
            <SelectItem value={null}>New link</SelectItem>
          </SelectContent>
        </Select>
      )}
      {share && <ShareLinkField shareId={share.id} />}
      <ShareLinkForm
        key={linkId}
        share={share}
        view={view}
        onCreated={setLinkId}
      />
      <DialogFooter className="sm:justify-between">
        <Button
          variant="link-muted"
          onClick={() => window.open(sharesUrl, '_blank')}
        >
          Manage shares
        </Button>
        <div className="flex gap-2">
          <DialogClose render={<Button type="button" variant="outline" />}>
            {share ? 'Close' : 'Cancel'}
          </DialogClose>
          <Button type="submit" form={SHARE_FORM_ID} disabled={saving}>
            <LoadingContent loading={saving}>
              {share ? 'Save changes' : 'Share'}
            </LoadingContent>
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
