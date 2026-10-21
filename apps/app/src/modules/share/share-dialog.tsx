import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ShareRefresh,
  shareRefreshLabels,
} from '@tamery/shared/enums/share-refresh'
import { enabledFilters } from '@tamery/shared/filters'
import { objectEntries, pick } from '@tamery/shared/utils'
import { Alert, AlertDescription } from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tamery/ui/components/select'
import { Switch } from '@tamery/ui/components/switch'
import { Form, useAppForm } from '@tamery/ui/components/tanstack-form'
import { copy } from '@tamery/ui/lib/copy'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type } from 'arktype'
import { addDays, format } from 'date-fns'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { OptionField } from '~/components/option-field'
import { getColumnKind } from '~/core/table/cell/utils'
import { orpc, orpcProxy } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { sharesUrl, shareUrl } from '~/lib/urls'
import { useTableColumnsContext } from '~/modules/table/lib/columns'
import { columnView, useTablePageStore } from '~/modules/table/lib/store'
import { plural } from '~/utils/plural'

import { ShareLinkActions } from './share-link'
import { sharesQueryOptions } from './shares-query'
import { sameShareView, useTableShare } from './use-table-share'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'share-dialog'

const EXPIRY_DAYS = { day: 1, month: 30, week: 7 }

type Expiry = keyof typeof EXPIRY_DAYS | 'current' | 'never'

const getExpiresAt = (expires: Expiry, current: Date | null) => {
  if (expires === 'current') {
    return current
  }
  if (expires === 'never') {
    return null
  }
  return addDays(new Date(), EXPIRY_DAYS[expires])
}

const REFRESH_ITEMS = objectEntries(shareRefreshLabels).map(
  ([value, label]) => ({ label, value })
)

interface ShareTarget {
  schema: string
  table: string
}

const useShareView = () => {
  const { dialect } = useRouteContext()
  const { columns } = useTableColumnsContext()
  const { filters, orderBy, ...layout } = useSubscription(useTablePageStore(), {
    selector: (state) => ({
      ...pick(state, ['columnOrder', 'hiddenColumns', 'pinnedColumns']),
      filters: enabledFilters(state.filters),
      orderBy: state.orderBy,
    }),
  })
  return {
    columnTypes: columns.flatMap(({ id, type: columnType }) =>
      columnType === undefined ? [] : [{ id, type: columnType }]
    ),
    columns: columnView(columns, layout, true).visible.map((column) => ({
      id: column.id,
      kind: getColumnKind(dialect, column),
      type: column.type ?? null,
    })),
    filters,
    orderBy,
  }
}

type TableShare = ReturnType<typeof useTableShare>['shares'][number]

const formDefaults = (share: TableShare | null, table: string) => ({
  description: share?.description ?? '',
  expires: (share?.expiresAt ? 'current' : 'never') as Expiry,
  includeFilters: !share || share.view.filters.length > 0,
  name: share?.name ?? table,
  password: '',
  protect: share?.hasPassword ?? false,
  refresh: share?.refresh ?? ShareRefresh.Minute,
})

const MovedViewNote = ({
  saved,
  view,
}: {
  saved: TableShare['view']
  view: ReturnType<typeof useShareView>
}) =>
  !sameShareView(saved, view) && (
    <p className="text-muted-foreground text-xs">
      This link was saved with other columns, filters or sort. Saving moves it
      to what the table shows now.
    </p>
  )

const ShareLinkForm = ({
  onCreated,
  schema,
  share,
  table,
  view,
}: ShareTarget & {
  onCreated: (id: string) => void
  share: TableShare | null
  view: ReturnType<typeof useShareView>
}) => {
  const { connectionResource, dialect } = useRouteContext()
  const { filters } = view
  const expiryItems: { label: string; value: Expiry }[] = [
    ...(share?.expiresAt
      ? [
          {
            label: `On ${format(share.expiresAt, 'PP')}`,
            value: 'current' as const,
          },
        ]
      : []),
    { label: 'Never', value: 'never' },
    { label: 'In 1 day', value: 'day' },
    { label: 'In 7 days', value: 'week' },
    { label: 'In 30 days', value: 'month' },
  ]

  const save = useMutation({
    meta: { event: share ? 'share_updated' : 'share_created' },
    mutationFn: async (values: typeof form.state.values) => {
      const shared = {
        ...view,
        filters: values.includeFilters ? filters : [],
        schema,
        table,
      }
      await orpcProxy.shares.check({
        ...shared,
        dialect,
        resourceId: connectionResource.id,
      })
      return orpc.shares.save.call({
        ...shared,
        connectionResourceId: connectionResource.id,
        id: share?.id,
        description: values.description.trim() || null,
        expiresAt: getExpiresAt(values.expires, share?.expiresAt ?? null),
        name: values.name.trim(),
        refresh: values.refresh,
        ...(!values.protect && { password: null }),
        ...(values.protect && values.password && { password: values.password }),
      })
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({
        queryKey: sharesQueryOptions.queryKey,
      })
      if (share) {
        toast.success('Share updated')
      } else if (saved) {
        copy(shareUrl(saved.id))
        toast.success('Link copied')
        onCreated(saved.id)
      }
    },
  })

  const form = useAppForm({
    defaultValues: formDefaults(share, table),
    onSubmit: ({ value }) => save.mutate(value),
    validators: {
      onChange: type({
        name: type(/\S/u).configure({ message: 'Give the share a name.' }),
        password: 'string',
        protect: 'boolean',
      }).narrow(
        (values, ctx) =>
          !values.protect ||
          values.password !== '' ||
          !!share?.hasPassword ||
          ctx.reject({ message: 'Enter a password.', path: ['password'] })
      ),
    },
  })

  return (
    <>
      {share && (
        <Field>
          <FieldLabel htmlFor="share-link">Link</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="share-link"
              readOnly
              value={shareUrl(share.id)}
              data-mask
              onFocus={(event) => event.currentTarget.select()}
            />
            <InputGroupAddon align="inline-end">
              <ShareLinkActions shareId={share.id} />
            </InputGroupAddon>
          </InputGroup>
        </Field>
      )}
      <Form id={FORM_ID} form={form}>
        <div className="flex flex-col gap-3">
          <form.AppField name="name">
            {(field) => (
              <field.Field>
                <field.Label>Name</field.Label>
                <field.Input autoFocus={!share} autoComplete="off" data-mask />
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="description">
            {(field) => (
              <field.Field>
                <field.Label>Description</field.Label>
                <field.Textarea placeholder="Optional" rows={2} data-mask />
              </field.Field>
            )}
          </form.AppField>
          <div className="grid grid-cols-2 gap-3">
            <form.AppField name="refresh">
              {(field) => (
                <field.Field>
                  <field.Label>Refresh</field.Label>
                  <field.Select items={REFRESH_ITEMS} />
                </field.Field>
              )}
            </form.AppField>
            <form.AppField name="expires">
              {(field) => (
                <field.Field>
                  <field.Label>Expires</field.Label>
                  <field.Select items={expiryItems} />
                </field.Field>
              )}
            </form.AppField>
          </div>
          {filters.length > 0 && (
            <form.AppField name="includeFilters">
              {(field) => (
                <OptionField
                  htmlFor={field.name}
                  title="Apply the table’s filters"
                  description={`Viewers see only the rows the ${plural(filters.length, 'filter')} let through.`}
                >
                  <Switch
                    id={field.name}
                    size="sm"
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </OptionField>
              )}
            </form.AppField>
          )}
          <form.AppField name="protect">
            {(field) => (
              <OptionField
                htmlFor={field.name}
                title="Require a password"
                description="Viewers enter it once to open the link."
              >
                <Switch
                  id={field.name}
                  size="sm"
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </OptionField>
            )}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.protect}>
            {(protect) => (
              <AnimatePresence initial={false}>
                {protect && (
                  <MotionCollapse key="share-password">
                    <form.AppField name="password">
                      {(field) => (
                        <field.Field>
                          <field.Label>Password</field.Label>
                          <field.PasswordInput
                            autoComplete="new-password"
                            placeholder={
                              share?.hasPassword ? 'Unchanged' : undefined
                            }
                          />
                        </field.Field>
                      )}
                    </form.AppField>
                  </MotionCollapse>
                )}
              </AnimatePresence>
            )}
          </form.Subscribe>
          {share && (
            <form.Subscribe selector={(state) => state.values.includeFilters}>
              {(includeFilters) => (
                <MovedViewNote
                  saved={share.view}
                  view={{ ...view, filters: includeFilters ? filters : [] }}
                />
              )}
            </form.Subscribe>
          )}
          <p className="text-muted-foreground text-xs">
            {`Anyone with the link sees the ${plural(view.columns.length, 'column')} the table shows, in its order. Tamery’s servers read the rows from your database each time the link refreshes; viewers can sort and scroll, never edit.`}
          </p>
          {save.error && (
            <Alert variant="error">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              <AlertDescription data-mask className="wrap-break-word">
                {save.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Form>
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
          <Button type="submit" form={FORM_ID} disabled={save.isPending}>
            <LoadingContent loading={save.isPending}>
              {share ? 'Save changes' : 'Share'}
            </LoadingContent>
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

const ShareForm = ({ schema, table }: ShareTarget) => {
  const { shares } = useTableShare(schema, table)
  const view = useShareView()
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
        schema={schema}
        share={share}
        table={table}
        view={view}
        onCreated={setLinkId}
      />
    </>
  )
}

export const ShareDialog = ({
  onOpenChange,
  open,
  ...target
}: ShareTarget & {
  onOpenChange: (open: boolean) => void
  open: boolean
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <ShareForm {...target} />
    </DialogContent>
  </Dialog>
)
