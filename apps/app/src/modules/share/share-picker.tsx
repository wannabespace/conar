import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { useState } from 'react'

import { ShareLinkForm } from './share-link-form'
import { useShareView } from './use-share-view'
import { sameShareView, useTableShare } from './use-table-share'

export const SharePicker = ({
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
  const share = shares.find(({ id }) => id === linkId) ?? null
  const linkItems = [
    ...shares.map(({ id, name }) => ({ label: name, value: id })),
    { label: 'New link', value: null },
  ]

  return (
    <>
      <DialogHeader>
        <DialogTitle>{share ? 'Shared table' : 'Share table'}</DialogTitle>
        <DialogDescription data-mask>{`${schema}.${table}`}</DialogDescription>
      </DialogHeader>
      {shares.length > 0 && (
        <Field>
          <FieldLabel id="share-target-label">Link</FieldLabel>
          <Select items={linkItems} value={linkId} onValueChange={setLinkId}>
            <SelectTrigger aria-labelledby="share-target-label">
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
        </Field>
      )}
      <ShareLinkForm
        key={linkId}
        share={share}
        view={view}
        onCreated={setLinkId}
      />
    </>
  )
}
