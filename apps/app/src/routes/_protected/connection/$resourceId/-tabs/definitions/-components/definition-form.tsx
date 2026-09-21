import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'
import { Skeleton } from '@tamery/ui/components/skeleton'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import type { UseQueryOptions } from '@tanstack/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type as arkType } from 'arktype'
import type * as monaco from 'monaco-editor'
import { toast } from 'sonner'

import { Monaco } from '~/components/monaco'
import { customQuery } from '~/entities/connection/queries/connection/custom'
import { sqlDialects } from '~/entities/connection/utils/monaco'
import { queryClient } from '~/lib/query-client'

import type { RunQuery } from '../-hooks/use-definitions-state'
import type { InspectorWarning } from './inspector'
import { InspectorFooter, InspectorSection } from './inspector'

const editorOptions = {
  fontSize: 12,
  lineNumbersMinChars: 3,
  padding: { top: 8 },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
} satisfies monaco.editor.IStandaloneEditorConstructionOptions

const readOnlyEditorOptions = {
  ...editorOptions,
  readOnly: true,
} satisfies monaco.editor.IStandaloneEditorConstructionOptions

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

const statementSchema = arkType(/\S/u).configure({
  message: 'Write a statement to run.',
})

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

const CREATE = /^CREATE\s+(?!OR\s+(?:REPLACE|ALTER)\b)/iu
// Re-running a captured DEFINER clause needs SUPER or SET_USER_ID.
const DEFINER = /\bDEFINER\s*=\s*(?:`[^`]*`|[^@\s]+)@(?:`[^`]*`|\S+)\s*/iu

const replaceInPlace: Partial<Record<ConnectionType, string>> = {
  mssql: 'CREATE OR ALTER ',
  postgres: 'CREATE OR REPLACE ',
}

export const ExistingDefinitionForm = ({
  drop,
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
  drop: Parameters<RunQuery>[0]
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
    return <EditorSkeleton />
  }

  const statement = definition.replace(DEFINER, '').trim()
  const keyword = dropsFirst ? undefined : replaceInPlace[type]

  return (
    <DefinitionForm
      hint={`Saving replaces the ${noun} with the statement below.`}
      initial={keyword ? statement.replace(CREATE, keyword) : statement}
      isNew={false}
      language={sqlDialects[type]}
      onSaved={onSaved}
      queryKey={queryKey}
      readOnly={readOnly}
      save={async (text) => {
        if (dropsFirst) {
          await run(drop)
        }
        await run(customQuery({ query: text }))
      }}
      success={`${uppercaseFirst(noun)} "${name}" saved`}
      warning={
        dropsFirst
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
