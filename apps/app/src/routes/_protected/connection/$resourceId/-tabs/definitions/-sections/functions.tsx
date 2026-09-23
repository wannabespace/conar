import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch, sameShape } from '@tamery/shared/utils'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'

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
  functionBodyTemplateOf,
  replacesRoutine,
} from '~/entities/connection/queries/functions/shape'
import { queryClient } from '~/lib/query-client'

import {
  BodyField,
  resetFields,
  SchemaField,
  SelectField,
  SwitchField,
  TextField,
} from '../-components/fields'
import type { SectionInspectorProps } from '../-components/inspector'
import {
  Inspector,
  InspectorSection,
  InspectorSql,
  replaceWarning,
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
  schemaBound: boolean
  securityDefiner: boolean
}

const functionSchema = type({
  body: type(/\S/u).configure({ message: 'Write the routine body.' }),
  kind: 'string',
  name: 'string',
  returnType: 'string',
}).narrow((draft, ctx) => {
  const named =
    /\S/u.test(draft.name) ||
    ctx.reject({
      message: `Give the ${draft.kind} a name.`,
      relativePath: ['name'],
    })
  const returns =
    draft.kind === 'procedure' ||
    /\S/u.test(draft.returnType) ||
    ctx.reject({
      message: 'Say what the function returns.',
      relativePath: ['returnType'],
    })

  return named && returns
})

const TRIGGER_FUNCTION_BODY = 'BEGIN\n  RETURN NEW;\nEND;'

const newDraft = (
  pageSchema: string,
  connectionType: ConnectionType,
  preset?: string
): FunctionDraft => {
  const { behaviors, languages } = capabilitiesOf(connectionType).functions
  const language = languages[0] ?? ''
  const trigger = preset === 'trigger'

  return {
    args: '',
    behavior: behaviors[0] ?? '',
    body: trigger
      ? TRIGGER_FUNCTION_BODY
      : functionBodyTemplateOf({
          connectionType,
          kind: 'function',
          language,
          returnType: '',
        }),
    extras: '',
    kind: 'function',
    language,
    name: '',
    returnType: trigger ? 'trigger' : '',
    schema: pageSchema,
    schemaBound: false,
    securityDefiner: false,
  }
}

const draftOf = (
  item: FunctionItem | null,
  pageSchema: string,
  connectionType: ConnectionType,
  preset?: string
): FunctionDraft => {
  const fallback = newDraft(pageSchema, connectionType, preset)

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
        schemaBound: item.schemaBound,
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
  schemaBound: draft.kind === 'function' && draft.schemaBound,
  securityDefiner: draft.securityDefiner,
})

// A catalog row the form cannot rebuild — a CLR or table-valued routine, a
// language we do not write, or a header option only the definition text
// carries — loses on save whatever these fields cannot express.
const formEditable = (item: FunctionItem, connectionType: ConnectionType) => {
  const { languages } = capabilitiesOf(connectionType).functions

  return (
    !item.custom &&
    !!item.body &&
    item.args !== null &&
    item.return_type !== 'table' &&
    (item.type === 'procedure' || !!item.return_type) &&
    (languages.length === 0 || languages.includes(item.language ?? ''))
  )
}

const hasExecutionOptions = ({
  behaviors,
  languages,
  schemaBinding,
  securityDefiner,
}: ReturnType<typeof capabilitiesOf>['functions']) =>
  languages.length > 0 ||
  behaviors.length > 0 ||
  schemaBinding ||
  securityDefiner

const FunctionInspector = ({
  can,
  connectionResource,
  item,
  onOpenChange,
  preset,
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
              replacesObject: replacesRoutine(
                {
                  args: item.args ?? null,
                  kind: item.type,
                  name: item.name,
                  returnType: item.return_type,
                },
                shapeOf(draft),
                connectionType
              ),
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
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? '', connectionType, preset),
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: { onChange: functionSchema, onMount: functionSchema },
  })
  const draft = useStore(form.store, (state) => state.values)

  const readOnly = item
    ? !can.edit || !formEditable(item, connectionType)
    : !can.create
  const execution = hasExecutionOptions(options)
  // A starter body only belongs to the shape it was written for, so switching
  // kind, language or return type swaps it — unless the user has typed their own.
  const retemplate = (next: FunctionDraft) => {
    const template = functionBodyTemplateOf({ connectionType, ...next })

    if (
      !item &&
      draft.body === functionBodyTemplateOf({ connectionType, ...draft })
    ) {
      resetFields(form, { body: template })
    }
  }
  const returns = draft.kind === 'function'
  const saved = item && shapeOf(draftOf(item, draft.schema, connectionType))
  const changed = !saved || !sameShape(shapeOf(draft), saved)

  return (
    <Inspector
      canSave={changed}
      description={item?.schema ?? draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun={draft.kind}
      readOnly={readOnly}
      warning={
        item
          ? replaceWarning({ connectionType, name: item.name, noun: item.type })
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
              placeholder={options.argumentPlaceholder}
            />
          )}
        </form.AppField>
        {returns && (
          <form.AppField
            name="returnType"
            listeners={{
              onChange: ({ value }) =>
                retemplate({ ...draft, returnType: value }),
            }}
          >
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
          {returns && options.schemaBinding && (
            <form.AppField name="schemaBound">
              {() => (
                <SwitchField
                  title="Schema bound"
                  description="Locks the tables it reads against changes. Policy predicates require it."
                  disabled={readOnly}
                />
              )}
            </form.AppField>
          )}
          {options.securityDefiner && (
            <form.AppField name="securityDefiner">
              {() => (
                <SwitchField
                  title="Security definer"
                  description="Runs with the owner's rights instead of the caller's."
                  disabled={readOnly}
                />
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
