import { API_KEY_PERMISSIONS } from '@tamery/shared/constants'
import { objectEntries } from '@tamery/shared/utils/helpers'
import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '@tamery/ui/components/dialog'
import { Field, FieldLabel } from '@tamery/ui/components/field'
import { Fieldset } from '@tamery/ui/components/fieldset'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@tamery/ui/components/input-group'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '~/lib/orpc'
import { handleError } from '~/utils/error'

type PermissionSelection = {
  [K in keyof typeof API_KEY_PERMISSIONS]: Record<(typeof API_KEY_PERMISSIONS)[K][number], boolean>
}

const defaultCreateApiKeyFormValues = {
  name: '',
  permissions: {
    connections: {
      read: true,
      write: false,
    },
  } satisfies PermissionSelection,
}

function permissionSelectionToPayload(selection: PermissionSelection) {
  const out: {
    [K in keyof typeof API_KEY_PERMISSIONS]: (typeof API_KEY_PERMISSIONS)[K][number][]
  } = {
    connections: [],
  }

  for (const [resource, actions] of objectEntries(selection)) {
    out[resource] = objectEntries(actions)
      .filter(([, on]) => on)
      .map(([action]) => action)
  }

  return out
}

export function CreateApiKeyDialog({
  ref,
  onRefetch,
}: {
  ref?: React.RefObject<{ open: () => void } | null>
  onRefetch: () => void
}) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [revealKeyDialogOpen, setRevealKeyDialogOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<{ id: string; key: string } | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setCreateDialogOpen(true)
      },
    }),
    [],
  )

  const form = useAppForm({
    defaultValues: defaultCreateApiKeyFormValues,
    onSubmit: async ({ value }) => {
      try {
        const data = await orpc.account.apiKeys.create.call({
          name: value.name.trim(),
          permissions: permissionSelectionToPayload(value.permissions),
        })
        setCreateDialogOpen(false)
        setRevealKeyDialogOpen(true)
        form.reset()
        setCreatedKey({ id: data.id, key: data.key })
        onRefetch()
        toast.success('API key created')
      } catch (e) {
        handleError(e)
      }
    },
  })

  const isSubmitting = useStore(form.store, state => state.isSubmitting)

  return (
    <>
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Name it so you can tell keys apart later, and choose what this key is allowed to do.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <form
              id="create-api-key-form"
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <Fieldset className="flex w-full flex-col gap-6">
                <form.AppField
                  name="name"
                  validators={{
                    onSubmit: ({ value }) => {
                      if (value.trim().length < 2) {
                        return 'Name must be at least 2 characters'
                      }
                    },
                  }}
                >
                  {field => (
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <field.Input placeholder="e.g. local-mcp, ci-bot" maxLength={100} />
                      <field.Error />
                    </Field>
                  )}
                </form.AppField>
                <form.AppField
                  name="permissions"
                  validators={{
                    onSubmit: ({ value }) => {
                      const atLeastOne = Object.values(value).some(actions =>
                        Object.values(actions).some(Boolean),
                      )
                      if (!atLeastOne) {
                        return 'Select at least one permission'
                      }
                    },
                  }}
                >
                  {field => (
                    <Field>
                      <FieldLabel>Permissions</FieldLabel>
                      {objectEntries(API_KEY_PERMISSIONS).map(([resource, actions]) => (
                        <Field key={resource} className="gap-1">
                          {actions.map(action => (
                            <label
                              key={action}
                              className={`flex cursor-pointer items-center gap-2 text-sm`}
                            >
                              <Checkbox
                                checked={field.state.value[resource][action]}
                                onCheckedChange={checked => {
                                  field.handleChange({
                                    ...field.state.value,
                                    [resource]: {
                                      ...field.state.value[resource],
                                      [action]: checked === true,
                                    },
                                  })
                                }}
                              />
                              {resource}:{action}
                            </label>
                          ))}
                        </Field>
                      ))}
                      <field.Error />
                    </Field>
                  )}
                </form.AppField>
              </Fieldset>
            </form>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" form="create-api-key-form" disabled={isSubmitting}>
              <LoadingContent loading={isSubmitting}>Create</LoadingContent>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={revealKeyDialogOpen}
        onOpenChange={setRevealKeyDialogOpen}
        onOpenChangeComplete={isOpen => {
          if (!isOpen) {
            setCreatedKey(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              This key is shown only once. Copy and store it safely.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            {createdKey && (
              <InputGroup className="font-mono text-xs shadow-none">
                <InputGroupInput
                  readOnly
                  value={createdKey.key}
                  className="min-w-0 overflow-x-auto font-mono text-xs"
                />
                <InputGroupAddon align="inline-end">
                  <CopyButton
                    text={createdKey.key}
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Copy API key"
                    onClick={() => toast.success('API key copied')}
                  />
                </InputGroupAddon>
              </InputGroup>
            )}
          </DialogPanel>
          <DialogFooter>
            <Button type="button" onClick={() => setRevealKeyDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
