import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'

import { customQuery } from '~/entities/connection/queries/connection/custom'
import { sqlDialects } from '~/entities/connection/utils/monaco'

import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { RunQuery } from '../-hooks/use-definitions-state'
import type { InspectorWarning } from './inspector'
import { InspectorFooter, InspectorSection } from './inspector'
import { SqlEditor, SqlEditorSkeleton } from './sql-editor'

const requireStatement = ({ value }: { value: string }) =>
  value.trim() === '' ? 'Write a statement to run.' : undefined

export const DefinitionForm = ({
  hint,
  initial,
  isNew,
  language,
  onSaved,
  queryKey,
  readOnly,
  save,
  success,
  warning,
}: {
  hint: string
  initial: string
  isNew: boolean
  language: string
  onSaved: () => void
  queryKey: readonly unknown[]
  readOnly: boolean
  save: (definition: string) => Promise<unknown>
  success: string
  warning?: InspectorWarning | undefined
}) => {
  const mutation = useDefinitionMutation({
    mutationFn: (definition: string) => save(definition),
    onSuccess: onSaved,
    queryKey,
    success: () => success,
  })
  const form = useAppForm({
    defaultValues: { definition: initial },
    onSubmit: ({ value }) => {
      mutation.mutate(value.definition)
    },
  })
  const definition = useStore(form.store, (state) => state.values.definition)

  return (
    <>
      <form.AppField
        name="definition"
        validators={{ onChange: requireStatement, onMount: requireStatement }}
      >
        {(field) => (
          <InspectorSection
            title="Definition"
            className="min-h-0 flex-1"
            description={hint}
            action={<field.Error />}
          >
            <field.Field className="min-h-0 flex-1">
              <SqlEditor
                language={language}
                value={field.state.value}
                readOnly={readOnly}
                onChange={field.handleChange}
                onSubmit={() => form.handleSubmit()}
              />
            </field.Field>
          </InspectorSection>
        )}
      </form.AppField>
      <InspectorFooter
        canSave={isNew || definition !== initial}
        error={mutation.error}
        form={form}
        readOnly={readOnly}
        saveLabel={isNew ? 'Create' : 'Save'}
        saving={mutation.isPending}
        warning={warning}
      />
    </>
  )
}

const CREATE = /^(?<lead>\s*)CREATE\s+(?!OR\s+(?:REPLACE|ALTER)\b)/iu
const DEFINER = /\bDEFINER\s*=\s*(?:`[^`]*`|[^@\s]+)@(?:`[^`]*`|\S+)\s*/iu

const alterKeyword: Partial<Record<ConnectionType, string>> = {
  mssql: '$<lead>CREATE OR ALTER ',
  postgres: '$<lead>CREATE OR REPLACE ',
}

// The catalog hands back the original CREATE; saving it has to replace in place
// instead of failing on a duplicate name, unless the object is dropped first.
// MySQL's DEFINER clause goes: re-running it needs SUPER or SET_USER_ID.
const editable = (
  definition: string,
  type: ConnectionType,
  dropsFirst: boolean
) => {
  const statement = definition.replace(DEFINER, '')
  const keyword = alterKeyword[type]

  return dropsFirst || !keyword ? statement : statement.replace(CREATE, keyword)
}

const dropFirstWarning = (noun: string, name: string): InspectorWarning => ({
  action: `Replace ${noun}`,
  description: (
    <>
      This database cannot replace a {noun} in place, so{' '}
      <span data-mask className="font-medium">
        {name}
      </span>{' '}
      is dropped before the statement below runs. A statement the database
      rejects leaves the {noun} dropped.
    </>
  ),
})

export const ExistingDefinitionForm = ({
  dropFirst,
  dropsFirst,
  name,
  noun,
  onSaved,
  query,
  queryKey,
  readOnly,
  run,
  type,
}: {
  dropFirst: Parameters<RunQuery>[0]
  // Undefined while the caller still works out whether the dialect can
  // replace in place.
  dropsFirst: boolean | undefined
  name: string
  noun: string
  onSaved: () => void
  query: UseQueryOptions<string, Error, string, string[]>
  queryKey: readonly unknown[]
  readOnly: boolean
  run: RunQuery
  type: ConnectionType
}) => {
  const { data: definition, error } = useQuery(query)

  if (error) {
    return (
      <p data-mask className="text-destructive p-3 text-sm">
        {error.message}
      </p>
    )
  }

  if (definition === undefined || dropsFirst === undefined) {
    return <SqlEditorSkeleton />
  }

  const save = async (text: string) => {
    if (dropsFirst) {
      await run(dropFirst)
    }
    await run(customQuery({ query: text }))
  }

  return (
    <DefinitionForm
      hint={`Saving replaces the ${noun} with the statement below.`}
      initial={editable(definition, type, dropsFirst)}
      isNew={false}
      language={sqlDialects[type]}
      onSaved={onSaved}
      queryKey={queryKey}
      readOnly={readOnly}
      save={save}
      success={`${uppercaseFirst(noun)} "${name}" saved`}
      warning={dropsFirst ? dropFirstWarning(noun, name) : undefined}
    />
  )
}
