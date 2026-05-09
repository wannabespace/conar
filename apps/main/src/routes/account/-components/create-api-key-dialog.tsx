import { API_KEY_PERMISSIONS } from '@conar/shared/constants'
import { objectEntries } from '@conar/shared/utils/helpers'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { CopyButton } from '@conar/ui/components/custom/copy-button'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogTitle } from '@conar/ui/components/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@conar/ui/components/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@conar/ui/components/input-group'
import { useAppForm } from '@conar/ui/hooks/use-app-form'
import { useStore } from '@tanstack/react-form'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { orpc } from '~/lib/orpc'
import { handleError } from '~/utils/error'

type PermissionSelection = {
  [K in keyof typeof API_KEY_PERMISSIONS]: Record<typeof API_KEY_PERMISSIONS[K][number], boolean>
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
    [K in keyof typeof API_KEY_PERMISSIONS]: typeof API_KEY_PERMISSIONS[K][number][]
  } = {
    connections: [],
  }

  for (const [resource, actions] of objectEntries(selection)) {
    out[resource] = objectEntries(actions).filter(([, on]) => on).map(([action]) => action)
  }

  return out
}

export function CreateApiKeyDialog({ ref, onRefetch }: {
  ref?: React.RefObject<{ open: () => void } | null>
  onRefetch: () => void
}) {
  const [open, setOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<{ id: string, key: string } | null>(null)

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true)
    },
  }), [])

  const form = useAppForm({
    defaultValues: defaultCreateApiKeyFormValues,
    onSubmit: async ({ value }) => {
      try {
        const data = await orpc.account.apiKeys.create.call({
          name: value.name.trim(),
          permissions: permissionSelectionToPayload(value.permissions),
        })
        setCreatedKey({ id: data.id, key: data.key })
        onRefetch()
        toast.success('API key created')
      }
      catch (e) {
        handleError(e)
      }
    },
  })

  function handleCloseFlow() {
    setCreatedKey(null)
    setOpen(false)
    form.reset()
  }

  const isSubmitting = useStore(form.store, state => state.isSubmitting)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setCreatedKey(null)
          form.reset()
        }
      }}
    >
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
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup className="gap-4">
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
                  <field.Input
                    label="Name"
                    id="api-key-name"
                    placeholder="e.g. local-mcp, ci-bot"
                    maxLength={100}
                  />
                )}
              </form.AppField>
              <form.Field
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
                {(field) => {
                  const selection = field.state.value

                  return (
                    <Field data-invalid={!field.state.meta.isValid}>
                      <FieldLabel>Permissions</FieldLabel>
                      {objectEntries(API_KEY_PERMISSIONS).map(([resource, actions]) => (
                        <Field key={resource} className="gap-1">
                          {actions.map(action => (
                            <label
                              key={action}
                              className={`
                                flex cursor-pointer items-center gap-2 text-sm
                              `}
                            >
                              <Checkbox
                                checked={selection[resource][action]}
                                onCheckedChange={(checked) => {
                                  field.handleChange({
                                    ...selection,
                                    [resource]: {
                                      ...selection[resource],
                                      [action]: checked === true,
                                    },
                                  })
                                }}
                              />
                              {resource}
                              :
                              {action}
                            </label>
                          ))}
                        </Field>
                      ))}
                      {!field.state.meta.isValid && (
                        <FieldError
                          errors={field.state.meta.errors.map(err =>
                            typeof err === 'string' ? { message: err } : err,
                          )}
                        />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
            </FieldGroup>
          </form>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="create-api-key-form" disabled={isSubmitting}>
            <LoadingContent loading={isSubmitting}>
              Create
            </LoadingContent>
          </Button>
        </DialogFooter>

        <Dialog
          open={!!createdKey}
          onOpenChange={(next) => {
            if (!next) {
              handleCloseFlow()
            }
          }}
        >
          <DialogContent
            className="sm:max-w-md"
            showCloseButton={false}
          >
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
              <Button type="button" onClick={handleCloseFlow}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
