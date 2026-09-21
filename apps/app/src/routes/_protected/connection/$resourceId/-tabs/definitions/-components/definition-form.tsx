import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'

import { Monaco } from '~/components/monaco'
import type { DefinitionsNoun } from '~/entities/connection/capabilities'
import { sqlDialects } from '~/entities/connection/utils/monaco'
import { queryClient } from '~/lib/query-client'

import type { RunQuery } from '../-hooks/use-definitions-state'
import { editorOptions, readOnlyEditorOptions } from './fields'
import type { InspectorWarning } from './inspector'
import { InspectorFooter, InspectorSection } from './inspector'

const EditorSkeleton = () => (
  <InspectorSection title="Definition" className="min-h-0 flex-1">
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Skeleton className="h-3 w-3/5 rounded-full" />
      <Skeleton className="h-3 w-2/5 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
      <Skeleton className="h-3 w-1/3 rounded-full" />
    </div>
  </InspectorSection>
)

const statementSchema = type(/\S/u).configure({
  message: 'Write a statement to run.',
})

const DefinitionForm = ({
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
  const mutation = useMutation({
    mutationFn: (definition: string) => save(definition),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(success)
      onSaved()
    },
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
        validators={{ onChange: statementSchema, onMount: statementSchema }}
      >
        {(field) => (
          <InspectorSection
            title="Definition"
            className="min-h-0 flex-1"
            description={hint}
            action={<field.Error />}
          >
            <field.Field className="min-h-0 flex-1">
              <Monaco
                data-mask
                className="ring-foreground/4 min-h-0 flex-1 overflow-hidden rounded-xl ring"
                language={language}
                value={field.state.value}
                options={readOnly ? readOnlyEditorOptions : editorOptions}
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

const newDefinitions = {
  function: {
    hint: 'A function declares its arguments, what it returns and its body.',
    template: {
      clickhouse: () => '',
      mssql: (schema) =>
        `CREATE OR ALTER FUNCTION [${schema}].[new_function]()\nRETURNS INT\nAS\nBEGIN\n  RETURN 0;\nEND`,
      mysql: (schema) =>
        `CREATE FUNCTION \`${schema}\`.\`new_function\`()\nRETURNS INT\nDETERMINISTIC\nBEGIN\n  RETURN 0;\nEND`,
      postgres: (schema) =>
        `CREATE OR REPLACE FUNCTION "${schema}".new_function()\nRETURNS void\nLANGUAGE plpgsql\nAS $$\nBEGIN\n\nEND;\n$$;`,
    },
  },
} satisfies Partial<
  Record<
    DefinitionsNoun,
    {
      hint: string
      template: Record<ConnectionType, (schema: string) => string>
    }
  >
>

export const NewDefinitionForm = ({
  createQuery,
  noun,
  onSaved,
  queryKey,
  readOnly,
  run,
  schema,
  type: connectionType,
}: {
  createQuery: (create: string) => Parameters<RunQuery>[0]
  noun: keyof typeof newDefinitions
  onSaved: () => void
  queryKey: readonly unknown[]
  readOnly: boolean
  run: RunQuery
  schema: string
  type: ConnectionType
}) => {
  const { hint, template } = newDefinitions[noun]

  return (
    <DefinitionForm
      hint={hint}
      initial={template[connectionType](schema)}
      isNew
      language={sqlDialects[connectionType]}
      onSaved={onSaved}
      queryKey={queryKey}
      readOnly={readOnly}
      save={(text) => run(createQuery(text))}
      success={`${uppercaseFirst(noun)} created`}
    />
  )
}

const CREATE = /^CREATE\s+(?!OR\s+(?:REPLACE|ALTER)\b)/iu
// Re-running a captured DEFINER clause needs SUPER or SET_USER_ID.
const DEFINER = /\bDEFINER\s*=\s*(?:`[^`]*`|[^@\s]+)@(?:`[^`]*`|\S+)\s*/iu

const replaceInPlace: Partial<Record<ConnectionType, string>> = {
  mssql: 'CREATE OR ALTER ',
  postgres: 'CREATE OR REPLACE ',
}

export const ExistingDefinitionForm = ({
  createQuery,
  dropsFirst,
  name,
  noun,
  onSaved,
  query,
  queryKey,
  readOnly,
  recreateQuery,
  run,
  type: connectionType,
}: {
  createQuery: (create: string) => Parameters<RunQuery>[0]
  // Undefined while the caller still works out whether the dialect can
  // replace in place.
  dropsFirst?: boolean
  name: string
  noun: string
  onSaved: () => void
  query: UseQueryOptions<string, Error, string, string[]>
  queryKey: readonly unknown[]
  recreateQuery: (create: string) => Parameters<RunQuery>[0]
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
    return <EditorSkeleton />
  }

  const statement = definition.replace(DEFINER, '').trim()
  const keyword = dropsFirst ? undefined : replaceInPlace[connectionType]
  // MySQL commits DDL implicitly, so its drop survives a failed CREATE even
  // inside the transaction the swap runs in.
  const dropIsPermanent = dropsFirst && connectionType === ConnectionType.MySQL

  return (
    <DefinitionForm
      hint={`Saving replaces the ${noun} with the statement below.`}
      initial={keyword ? statement.replace(CREATE, keyword) : statement}
      isNew={false}
      language={sqlDialects[connectionType]}
      onSaved={onSaved}
      queryKey={queryKey}
      readOnly={readOnly}
      save={(text) => run(dropsFirst ? recreateQuery(text) : createQuery(text))}
      success={`${uppercaseFirst(noun)} "${name}" saved`}
      warning={
        dropIsPermanent
          ? {
              action: `Replace ${noun}`,
              description: (
                <>
                  No replace-in-place for a {noun} here, so we drop{' '}
                  <span data-mask className="font-medium">
                    {name}
                  </span>{' '}
                  first. If the statement below fails, it stays dropped.
                </>
              ),
            }
          : undefined
      }
    />
  )
}
