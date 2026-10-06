import { Button } from '@tamery/ui/components/button'
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
import { Field, FieldError, FieldLabel } from '@tamery/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@tamery/ui/components/input-group'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { createRef, useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'

import { createSchemaQuery } from '~/core/queries/schemas/create'
import { resourceTablesAndSchemasQueryOptions } from '~/core/queries/tables/list'
import { connectionResourceToQueryParams } from '~/core/runtime/query'
import { queryClient } from '~/lib/query-client'

import { createTableDialogRef } from './create-table-dialog'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const FORM_ID = 'schema-dialog'

export const createSchemaDialogRef = createRef<{ create: () => void }>()

export const SchemaForm = ({
  isTaken,
  onSubmit,
  pending,
  schema,
}: {
  isTaken: (name: string) => boolean
  onSubmit: (name: string) => void
  pending: boolean
  schema?: string
}) => {
  const [name, setName] = useState(schema ?? '')
  const [submitted, setSubmitted] = useState(false)
  const trimmed = name.trim()
  const taken = trimmed !== schema && isTaken(trimmed)
  let nameError: string | null = null
  if (taken) {
    nameError = 'A schema with this name already exists'
  } else if (submitted && !trimmed) {
    nameError = 'Give the schema a name.'
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{schema ? 'Rename schema' : 'New schema'}</DialogTitle>
        <DialogDescription data-mask={!!schema || undefined}>
          {schema ?? 'Its first table is created right after.'}
        </DialogDescription>
      </DialogHeader>
      <form
        id={FORM_ID}
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(true)
          if (trimmed && !taken && trimmed !== schema) {
            onSubmit(trimmed)
          }
        }}
      >
        <Field>
          <FieldLabel htmlFor="schema-dialog-name">Name</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="schema-dialog-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              data-mask
            />
            <InputGroupAddon align="inline-end">
              {nameError && <FieldError>{nameError}</FieldError>}
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </form>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={pending}>
          <LoadingContent loading={pending}>
            {schema ? 'Rename' : 'Create schema'}
          </LoadingContent>
        </Button>
      </DialogFooter>
    </>
  )
}

export const CreateSchemaDialog = () => {
  const { connectionResource } = useRouteContext()
  const [open, setOpen] = useState(false)
  const { data: tablesAndSchemas } = useQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )

  useImperativeHandle(createSchemaDialogRef, () => ({
    create: () => setOpen(true),
  }))

  const { mutate: createSchema, isPending } = useMutation({
    meta: { event: 'schema_created' },
    mutationFn: async (schema: string) => {
      await createSchemaQuery(schema).run(
        await connectionResourceToQueryParams(connectionResource)
      )
    },
    onError: (error) => {
      toast.error(`Failed to create schema "${error.message}".`)
    },
    onSuccess: (_, schema) => {
      setOpen(false)
      queryClient.invalidateQueries(
        resourceTablesAndSchemasQueryOptions({ connectionResource })
      )
      createTableDialogRef.current?.create(schema)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <SchemaForm
          isTaken={(name) =>
            !!tablesAndSchemas?.schemas.some((schema) => schema.name === name)
          }
          pending={isPending}
          onSubmit={createSchema}
        />
      </DialogContent>
    </Dialog>
  )
}
