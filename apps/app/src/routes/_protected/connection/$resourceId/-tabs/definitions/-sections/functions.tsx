import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch } from '@tamery/shared/utils/helpers'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { createFunctionQuery } from '~/entities/connection/queries/functions/create'
import { functionDefinitionQueryOptions } from '~/entities/connection/queries/functions/definition'
import { dropFunctionQuery } from '~/entities/connection/queries/functions/drop'
import type { functionsType } from '~/entities/connection/queries/functions/list'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import { recreateFunctionQuery } from '~/entities/connection/queries/functions/recreate'
import type { RoutineKind } from '~/entities/connection/queries/functions/routine-kind'
import type { FunctionShape } from '~/entities/connection/queries/functions/shape'
import { sqlDialects } from '~/entities/connection/utils/monaco'
import { queryClient } from '~/lib/query-client'

import {
  BodyField,
  resetFields,
  SchemaField,
  SelectField,
  TextField,
} from '../-components/fields'
import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorDefinition,
  InspectorFooter,
  InspectorHeader,
  InspectorOption,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { useFilter } from '../-hooks/use-filter'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, nameColumn, textColumn } from '../-lib/columns'

type FunctionItem = typeof functionsType.infer
type FunctionType = FunctionItem['type']

const typeLabels: Record<FunctionType, string> = {
  function: 'Function',
  procedure: 'Procedure',
}

const kinds = Object.keys(typeLabels) as RoutineKind[]

const argumentPlaceholders: Partial<Record<ConnectionType, string>> = {
  mssql: '@id int, @label nvarchar(50)',
  mysql: 'id INT, label VARCHAR(50)',
  postgres: 'id integer, label text',
}

const templateOf = ({
  connectionType,
  kind,
  language,
}: {
  connectionType: ConnectionType
  kind: RoutineKind
  language: string
}) => {
  if (connectionType === ConnectionType.Postgres) {
    return language === 'sql' ? 'SELECT 1;' : 'BEGIN\n\nEND;'
  }

  if (connectionType === ConnectionType.ClickHouse) {
    return ''
  }

  return kind === 'procedure' ? 'BEGIN\n\nEND' : 'BEGIN\n  RETURN 0;\nEND'
}

interface FunctionDraft {
  args: string
  behavior: string
  body: string
  extras: string
  kind: RoutineKind
  language: string
  name: string
  returnType: string
  schema: string
  securityDefiner: boolean
}

const functionSchema = type({
  name: type(/\S/u).configure({ message: 'Give the function a name.' }),
})

const dropParamsOf = (item: FunctionItem, cascade: boolean) => ({
  cascade,
  identity: item.identity,
  kind: item.type,
  name: item.name,
  schema: item.schema,
})

const newDraft = (
  pageSchema: string,
  connectionType: ConnectionType
): FunctionDraft => {
  const { behaviors, languages } = capabilitiesOf(connectionType).functions

  return {
    args: '',
    behavior: behaviors[0] ?? '',
    body: templateOf({
      connectionType,
      kind: 'function',
      language: languages[0] ?? '',
    }),
    extras: '',
    kind: 'function',
    language: languages[0] ?? '',
    name: '',
    returnType: '',
    schema: pageSchema,
    securityDefiner: false,
  }
}

const draftOf = (
  item: FunctionItem | null,
  pageSchema: string,
  connectionType: ConnectionType
): FunctionDraft => {
  const fallback = newDraft(pageSchema, connectionType)

  return item
    ? {
        ...fallback,
        args: item.args ?? '',
        behavior: item.behavior || fallback.behavior,
        body: item.body,
        extras: item.extras,
        kind: item.type,
        language: item.language || fallback.language,
        name: item.name,
        returnType: item.return_type ?? '',
        schema: item.schema,
        securityDefiner: item.securityDefiner,
      }
    : fallback
}

const shapeOf = (draft: FunctionDraft): FunctionShape => ({
  args: draft.args.trim(),
  behavior: draft.kind === 'procedure' ? '' : draft.behavior,
  body: draft.body,
  extras: draft.extras,
  kind: draft.kind,
  language: draft.language,
  name: draft.name.trim(),
  returnType: draft.returnType.trim(),
  securityDefiner: draft.securityDefiner,
})

// A catalog row the form cannot rebuild — a CLR or table-valued routine, or a
// language we do not write — would lose what it cannot express on save.
const formEditable = (item: FunctionItem, connectionType: ConnectionType) => {
  const { languages } = capabilitiesOf(connectionType).functions

  return (
    !!item.body &&
    item.args !== null &&
    item.return_type !== 'table' &&
    (item.type === 'procedure' || !!item.return_type) &&
    (languages.length === 0 || languages.includes(item.language ?? ''))
  )
}

// Postgres and SQL Server keep grants and owner through a replace, but only
// while the name, arguments, return type and kind stay put.
const replacesObject = (item: FunctionItem, shape: FunctionShape) =>
  item.name !== shape.name ||
  (item.args ?? '') !== shape.args ||
  (item.return_type ?? '') !== shape.returnType ||
  item.type !== shape.kind

const replaceWarning = (item: FunctionItem): InspectorWarning => ({
  action: `Replace ${item.type}`,
  description: (
    <>
      MySQL cannot roll DDL back, so we drop{' '}
      <span data-mask className="font-medium">
        {item.name}
      </span>{' '}
      and create it again. If the new statement fails, it stays dropped.
    </>
  ),
})

const FunctionSql = ({
  connectionResource,
  item,
}: Pick<SectionInspectorProps<FunctionItem>, 'connectionResource'> & {
  item: FunctionItem
}) => {
  const { data: definition } = useQuery(
    functionDefinitionQueryOptions({ connectionResource, item })
  )

  return definition ? <InspectorDefinition code={definition} /> : null
}

const ExecutionSection = ({
  form,
  onLanguageChanged,
  options,
  readOnly,
  returns,
}: {
  form: ReturnType<typeof useFunctionForm>
  onLanguageChanged?: (language: string) => void
  options: ReturnType<typeof capabilitiesOf>['functions']
  readOnly: boolean
  returns: boolean
}) => {
  if (
    options.languages.length === 0 &&
    options.behaviors.length === 0 &&
    !options.securityDefiner
  ) {
    return null
  }

  return (
    <InspectorSection
      title="Execution"
      description="How the database plans and runs the body."
    >
      {options.languages.length > 0 && (
        <form.AppField name="language">
          {() => (
            <SelectField
              label="Language"
              disabled={readOnly}
              onChanged={onLanguageChanged}
              options={options.languages}
              placeholder="Language"
            />
          )}
        </form.AppField>
      )}
      {returns && options.behaviors.length > 0 && (
        <form.AppField name="behavior">
          {() => (
            <SelectField
              label="Behavior"
              description="Tells the planner how far it may cache the result."
              disabled={readOnly}
              options={options.behaviors}
              placeholder="Behavior"
            />
          )}
        </form.AppField>
      )}
      {options.securityDefiner && (
        <form.AppField name="securityDefiner">
          {(field) => (
            <InspectorOption
              htmlFor="function-security-definer"
              title="Security definer"
              description="Runs with the owner's rights instead of the caller's."
            >
              <Switch
                id="function-security-definer"
                size="sm"
                disabled={readOnly}
                checked={field.state.value as boolean}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </InspectorOption>
          )}
        </form.AppField>
      )}
    </InspectorSection>
  )
}

const useFunctionForm = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: FunctionDraft
  onSubmit: (draft: FunctionDraft) => void
}) =>
  useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      onSubmit(value)
    },
    validators: { onChange: functionSchema, onMount: functionSchema },
  })

const FunctionInspector = ({
  can,
  connectionResource,
  item,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  type: connectionType,
}: SectionInspectorProps<FunctionItem>) => {
  const options = capabilitiesOf(connectionType).functions
  const mutation = useMutation({
    mutationFn: (draft: FunctionDraft) =>
      run(
        item
          ? recreateFunctionQuery({
              identity: item.identity,
              kind: item.type,
              name: item.name,
              replacesObject: replacesObject(item, shapeOf(draft)),
              schema: item.schema,
              shape: shapeOf(draft),
            })
          : createFunctionQuery({
              schema: draft.schema,
              shape: shapeOf(draft),
            })
      ),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `${typeLabels[draft.kind]} "${draft.name.trim()}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const form = useFunctionForm({
    defaultValues: draftOf(item, selectedSchema ?? '', connectionType),
    onSubmit: (draft) => mutation.mutate(draft),
  })
  const draft = useStore(form.store, (state) => state.values)

  const readOnly = item
    ? !can.edit || !formEditable(item, connectionType)
    : !can.create
  // A starter body only belongs to the shape it was written for, so switching
  // kind or language swaps it — unless the user has typed their own.
  const retemplate = (next: FunctionDraft) => {
    const template = templateOf({ connectionType, ...next })

    if (!item && draft.body === templateOf({ connectionType, ...draft })) {
      resetFields(form, { body: template })
    }
  }
  const returns = draft.kind === 'function'
  const complete =
    !!draft.body.trim() && (!returns || !!draft.returnType.trim())
  const changed =
    !item ||
    JSON.stringify(shapeOf(draft)) !==
      JSON.stringify(shapeOf(draftOf(item, draft.schema, connectionType)))

  return (
    <>
      <InspectorHeader
        description={item?.schema ?? draft.schema}
        item={item}
        noun="function"
      />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="A routine the database stores and runs on demand."
        >
          <form.AppField name="schema">
            {() => (
              <SchemaField disabled={readOnly || !!item} schemas={schemas} />
            )}
          </form.AppField>
          <form.AppField name="name">
            {() => <TextField label="Name" autoFocus disabled={readOnly} />}
          </form.AppField>
          <form.AppField name="kind">
            {() => (
              <SelectField
                label="Type"
                description="A procedure runs for its effects and returns nothing."
                disabled={readOnly}
                labelOf={(value: RoutineKind) => typeLabels[value]}
                onChanged={(kind: RoutineKind) =>
                  retemplate({ ...draft, kind })
                }
                options={kinds}
                placeholder="Type"
              />
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Signature"
          description="What callers pass in, and what comes back."
        >
          <form.AppField name="args">
            {() => (
              <TextField
                label="Arguments"
                description="Written as SQL, the way the routine declares them."
                disabled={readOnly}
                placeholder={argumentPlaceholders[connectionType]}
              />
            )}
          </form.AppField>
          {returns && (
            <form.AppField name="returnType">
              {() => (
                <TextField
                  label="Returns"
                  disabled={readOnly}
                  placeholder="integer"
                />
              )}
            </form.AppField>
          )}
        </InspectorSection>
        <ExecutionSection
          form={form}
          onLanguageChanged={(language) => retemplate({ ...draft, language })}
          options={options}
          readOnly={readOnly}
          returns={returns}
        />
        <InspectorSection title="Definition">
          <form.AppField name="body">
            {() => (
              <BodyField
                label="Body"
                disabled={readOnly}
                language={sqlDialects[connectionType]}
              />
            )}
          </form.AppField>
        </InspectorSection>
        {item && (
          <FunctionSql connectionResource={connectionResource} item={item} />
        )}
      </InspectorSections>
      <InspectorFooter
        canSave={changed && complete}
        error={mutation.error}
        form={form}
        readOnly={readOnly}
        saveLabel={item ? 'Save' : `Create ${draft.kind}`}
        saving={mutation.isPending}
        warning={
          item && connectionType === ConnectionType.MySQL
            ? replaceWarning(item)
            : undefined
        }
      />
    </>
  )
}

const columns: DefinitionsColumn<FunctionItem>[] = [
  nameColumn({ icon: () => SourceCodeIcon, width: 'w-3/12' }),
  labelColumn({
    header: 'Language',
    labelOf: (item: FunctionItem, { search }) =>
      item.language && <HighlightText text={item.language} match={search} />,
    width: 'w-2/12',
  }),
  textColumn({
    header: 'Returns',
    valueOf: (item: FunctionItem) => item.return_type,
  }),
  labelColumn({
    align: 'end',
    header: 'Arguments',
    labelOf: (item: FunctionItem) => (
      <span className="tabular-nums">{item.argumentCount ?? 0}</span>
    ),
    width: 'w-2/12',
  }),
  labelColumn({
    align: 'end',
    header: 'Type',
    labelOf: (item: FunctionItem) => typeLabels[item.type],
    width: 'w-2/12',
  }),
]

const functionKey = (item: FunctionItem) =>
  `${item.schema}.${item.name}(${item.identity ?? item.argumentCount ?? ''}).${item.type}`

export const Functions = () => {
  const state = useDefinitionsState({ section: 'functions' })
  const { connectionResource, run, search, selectedSchema } = state
  const query = resourceFunctionsQueryOptions({ connectionResource })
  const { data: functions = [], isPending } = useQuery(query)
  const typeFilter = useFilter<FunctionType>('All types', [
    { label: 'Functions', value: 'function' },
    { label: 'Procedures', value: 'procedure' },
  ])

  const inSchema = functions.filter((item) => item.schema === selectedSchema)
  const matches = (item: FunctionItem) =>
    typeFilter.matches(item.type) &&
    matchesSearch(search, item.name, item.language, item.return_type)
  const dropItem = (item: FunctionItem, cascade: boolean) =>
    run(dropFunctionQuery(dropParamsOf(item, cascade)))

  return (
    <DefinitionsPage
      columns={columns}
      dropItem={dropItem}
      Inspector={FunctionInspector}
      items={inSchema}
      keyOf={functionKey}
      loading={isPending}
      match={matches}
      queryKey={query.queryKey}
      state={state}
      toolbar={typeFilter.control}
    />
  )
}
