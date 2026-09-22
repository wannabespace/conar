import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch } from '@tamery/shared/utils'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { type } from 'arktype'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { sqlDialects } from '~/entities/connection/monaco'
import { createFunctionQuery } from '~/entities/connection/queries/functions/create'
import { functionDefinitionQueryOptions } from '~/entities/connection/queries/functions/definition'
import { dropFunctionQuery } from '~/entities/connection/queries/functions/drop'
import type { functionsType } from '~/entities/connection/queries/functions/list'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import { recreateFunctionQuery } from '~/entities/connection/queries/functions/recreate'
import type { RoutineKind } from '~/entities/connection/queries/functions/routine-kind'
import type { FunctionShape } from '~/entities/connection/queries/functions/shape'

import {
  BodyField,
  resetFields,
  SchemaField,
  SelectField,
  TextField,
} from '../-components/fields'
import type { SectionInspectorProps } from '../-components/inspector'
import {
  focusInvalidField,
  Inspector,
  InspectorOption,
  InspectorSection,
  InspectorSql,
  mysqlReplaceWarning,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
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
  body: type(/\S/u).configure({ message: 'Write the routine body.' }),
  kind: 'string',
  name: type(/\S/u).configure({ message: 'Give the function a name.' }),
  returnType: 'string',
}).narrow(
  (draft, ctx) =>
    draft.kind === 'procedure' ||
    /\S/u.test(draft.returnType) ||
    ctx.reject({
      message: 'Say what the function returns.',
      relativePath: ['returnType'],
    })
)

const newDraft = (
  pageSchema: string,
  connectionType: ConnectionType
): FunctionDraft => {
  const { behaviors, languages } = capabilitiesOf(connectionType).functions
  const language = languages[0] ?? ''

  return {
    args: '',
    behavior: behaviors[0] ?? '',
    body: templateOf({ connectionType, kind: 'function', language }),
    extras: '',
    kind: 'function',
    language,
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
  const mutation = useDefinitionMutation({
    message: (draft: FunctionDraft) =>
      `${typeLabels[draft.kind]} "${draft.name.trim()}" ${item ? 'saved' : 'created'}`,
    onOpenChange,
    queryKey,
    save: (draft: FunctionDraft) =>
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
  })
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? '', connectionType),
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    onSubmitInvalid: focusInvalidField,
    validators: { onChange: functionSchema, onMount: functionSchema },
  })
  const draft = useStore(form.store, (state) => state.values)

  const readOnly = item
    ? !can.edit || !formEditable(item, connectionType)
    : !can.create
  const execution =
    options.languages.length > 0 ||
    options.behaviors.length > 0 ||
    options.securityDefiner
  // A starter body only belongs to the shape it was written for, so switching
  // kind or language swaps it — unless the user has typed their own.
  const retemplate = (next: FunctionDraft) => {
    const template = templateOf({ connectionType, ...next })

    if (!item && draft.body === templateOf({ connectionType, ...draft })) {
      resetFields(form, { body: template })
    }
  }
  const returns = draft.kind === 'function'
  const changed =
    !item ||
    JSON.stringify(shapeOf(draft)) !==
      JSON.stringify(shapeOf(draftOf(item, draft.schema, connectionType)))

  return (
    <Inspector
      canSave={changed}
      description={item?.schema ?? draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun="function"
      readOnly={readOnly}
      saveLabel={item ? undefined : `Create ${draft.kind}`}
      warning={
        item && connectionType === ConnectionType.MySQL
          ? mysqlReplaceWarning({ name: item.name, noun: item.type })
          : undefined
      }
    >
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
              onChanged={(kind: RoutineKind) => retemplate({ ...draft, kind })}
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
      {execution && (
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
                  options={options.languages}
                  placeholder="Language"
                  onChanged={(language: string) =>
                    retemplate({ ...draft, language })
                  }
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
      )}
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
        <InspectorSql
          query={functionDefinitionQueryOptions({ connectionResource, item })}
        />
      )}
    </Inspector>
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
  textColumn({
    header: 'Arguments',
    valueOf: (item: FunctionItem) => item.args,
    width: 'w-3/12',
  }),
  labelColumn({
    align: 'end',
    header: 'Type',
    labelOf: (item: FunctionItem) => typeLabels[item.type],
    width: 'w-2/12',
  }),
]

const functionKey = (item: FunctionItem) =>
  JSON.stringify([item.schema, item.name, item.identity ?? '', item.type])

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

  return (
    <DefinitionsPage
      columns={columns}
      dropItem={(item, cascade) =>
        run(
          dropFunctionQuery({
            cascade,
            identity: item.identity,
            kind: item.type,
            name: item.name,
            schema: item.schema,
          })
        )
      }
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
