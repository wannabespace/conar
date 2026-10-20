import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ShareRefresh,
  shareRefreshLabels,
} from '@tamery/shared/enums/share-refresh'
import type { ShareView } from '@tamery/shared/share'
import { objectEntries } from '@tamery/shared/utils'
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
import { Switch } from '@tamery/ui/components/switch'
import { Form, useAppForm } from '@tamery/ui/components/tanstack-form'
import { copy } from '@tamery/ui/lib/copy'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { type } from 'arktype'
import { addDays, format } from 'date-fns'
import { AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

import { Link } from '~/components/link'
import { OptionField } from '~/components/option-field'
import { orpc, orpcProxy } from '~/lib/orpc'
import { queryClient } from '~/lib/query-client'
import { shareUrl } from '~/lib/urls'
import { plural } from '~/utils/plural'

import { ShareLinkActions } from './share-link'
import type { Share } from './shares-query'
import { sharesQueryOptions } from './shares-query'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'share-dialog'

const EXPIRY_DAYS = { day: 1, month: 30, week: 7 }

type Expiry = keyof typeof EXPIRY_DAYS | 'current' | 'never'

const REFRESH_ITEMS = objectEntries(shareRefreshLabels).map(
  ([value, label]) => ({ label, value })
)

export type TableView = Omit<ShareView, 'schema' | 'table'>

interface ShareTarget {
  schema: string
  share: Share | null
  table: string
  view: TableView
}

const ShareForm = ({ schema, share, table, view }: ShareTarget) => {
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
      let expiresAt = share?.expiresAt ?? null
      if (values.expires === 'never') {
        expiresAt = null
      } else if (values.expires !== 'current') {
        expiresAt = addDays(new Date(), EXPIRY_DAYS[values.expires])
      }
      await orpcProxy.shares.check({
        ...shared,
        dialect,
        resourceId: connectionResource.id,
      })
      return orpc.shares.save.call({
        ...shared,
        connectionResourceId: connectionResource.id,
        description: values.description.trim() || null,
        expiresAt,
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
      }
    },
  })

  const form = useAppForm({
    defaultValues: {
      description: share?.description ?? '',
      expires: (share?.expiresAt ? 'current' : 'never') as Expiry,
      includeFilters: true,
      name: share?.name ?? table,
      password: '',
      protect: share?.hasPassword ?? false,
      refresh: share?.refresh ?? ShareRefresh.Minute,
    },
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
          render={
            <Link to="/settings/$section" params={{ section: 'shares' }} />
          }
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
      <DialogHeader>
        <DialogTitle>
          {target.share ? 'Shared table' : 'Share table'}
        </DialogTitle>
        <DialogDescription
          data-mask
        >{`${target.schema}.${target.table}`}</DialogDescription>
      </DialogHeader>
      <ShareForm {...target} />
    </DialogContent>
  </Dialog>
)
