import { FlashIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch, sameShape, uppercaseFirst } from '@tamery/shared/utils'
import { Badge } from '@tamery/ui/components/badge'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { type } from 'arktype'
import { toast } from 'sonner'

import { capabilitiesOf } from '~/entities/connection/capabilities'
import { sqlDialects } from '~/entities/connection/monaco'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import { createTriggerQuery } from '~/entities/connection/queries/triggers/create'
import { triggerDefinitionQueryOptions } from '~/entities/connection/queries/triggers/definition'
import { dropTriggerQuery } from '~/entities/connection/queries/triggers/drop'
import type { triggersType } from '~/entities/connection/queries/triggers/list'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import { recreateTriggerQuery } from '~/entities/connection/queries/triggers/recreate'
import { setTriggerEnabledQuery } from '~/entities/connection/queries/triggers/set-enabled'
import type {
  TriggerEvent,
  TriggerOrientation,
  TriggerShape,
  TriggerTiming,
} from '~/entities/connection/queries/triggers/shape'
import {
  TRIGGER_EVENTS,
  TRIGGER_TIMINGS,
} from '~/entities/connection/queries/triggers/shape'
import { queryClient } from '~/lib/query-client'

import {
  BodyField,
  Labelled,
  OptionSelect,
  OptionsField,
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
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { useFilter } from '../-hooks/use-filter'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, nameColumn, textColumn } from '../-lib/columns'

type TriggerItem = typeof triggersType.infer

const triggerKey = (item: TriggerItem) =>
  JSON.stringify([item.schema, item.table, item.name, item.event])

const sentenceCase = (value: string) => uppercaseFirst(value.toLowerCase())

interface TriggerDraft {
  body: string
  events: TriggerEvent[]
  functionName: string
  functionSchema: string
  name: string
  orientation: TriggerOrientation
  schema: string
  table: string
  timing: TriggerTiming
}

const bodyTemplates: Partial<Record<ConnectionType, string>> = {
  mssql: 'BEGIN\n  SET NOCOUNT ON;\nEND',
  mysql: 'BEGIN\n\nEND',
}

const triggerSchemaOf = (usesBody: boolean) =>
  type({
    body: 'string',
    events: type('string[] >= 1').configure({
      message: 'Pick at least one event.',
    }),
    functionName: 'string',
    name: type(/\S/u).configure({ message: 'Give the trigger a name.' }),
    table: type(/\S/u).configure({ message: 'Pick the table to watch.' }),
  }).narrow((draft, ctx) => {
    if (usesBody) {
      return (
        /\S/u.test(draft.body) ||
        ctx.reject({
          message: 'Write what the trigger runs.',
          relativePath: ['body'],
        })
      )
    }

    return (
      draft.functionName !== '' ||
      ctx.reject({
        message: 'Pick the function to run.',
        relativePath: ['functionName'],
      })
    )
  })

const triggerSchemas = {
  body: triggerSchemaOf(true),
  function: triggerSchemaOf(false),
}

const draftOf = (
  item: TriggerItem | null,
  pageSchema: string,
  connectionType: ConnectionType
): TriggerDraft => {
  const { orientations, timings } = capabilitiesOf(connectionType).triggers

  return {
    body: item?.body || bodyTemplates[connectionType] || '',
    events: item
      ? TRIGGER_EVENTS.filter((event) => item.event.includes(event))
      : ['INSERT'],
    functionName: item?.functionName ?? '',
    functionSchema: item?.functionSchema ?? '',
    name: item?.name ?? '',
    orientation: item?.orientation ?? orientations[0] ?? 'ROW',
    timing:
      TRIGGER_TIMINGS.find((timing) => timing === item?.timing) ??
      timings[0] ??
      'AFTER',
    schema: item?.schema ?? pageSchema,
    table: item?.table ?? '',
  }
}

// Postgres refuses FOR EACH ROW on TRUNCATE and anything but ROW on INSTEAD OF.
const orientationsFor = (
  draft: TriggerDraft,
  allowed: readonly TriggerOrientation[]
) => {
  if (draft.timing === 'INSTEAD OF') {
    return allowed.filter((orientation) => orientation === 'ROW')
  }

  return draft.events.includes('TRUNCATE')
    ? allowed.filter((orientation) => orientation === 'STATEMENT')
    : allowed
}

// A trigger carrying a WHEN clause, a column list, function arguments, an
// order or a constraint cannot be rebuilt from these fields.
const formEditable = (item: TriggerItem, body: boolean) =>
  !item.custom && (!body || !!item.body)

const shapeOf = (draft: TriggerDraft): TriggerShape => ({
  body: draft.body,
  events: draft.events,
  functionName: draft.functionName,
  functionSchema: draft.functionSchema || draft.schema,
  name: draft.name.trim(),
  orientation: draft.orientation,
  timing: draft.timing,
})

interface TriggerToggle {
  enabled: boolean
  item: TriggerItem
}

const useToggle = ({
  queryKey,
  run,
}: Pick<SectionInspectorProps<TriggerItem>, 'queryKey' | 'run'>) =>
  useMutation({
    mutationFn: ({ enabled, item }: TriggerToggle) =>
      run(
        setTriggerEnabledQuery({
          enabled,
          mode: item.enabledMode,
          name: item.name,
          schema: item.schema,
          table: item.table,
        })
      ),
    onSuccess: async (_result, { enabled, item }) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Trigger "${item.name}" ${enabled ? 'enabled' : 'disabled'}`
      )
    },
  })

const TriggerInspector = ({
  can,
  connectionResource,
  item: snapshot,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  tablesOf,
  type: connectionType,
  viewsOf,
}: SectionInspectorProps<TriggerItem>) => {
  const { data: triggers = [] } = useQuery(
    resourceTriggersQueryOptions({ connectionResource })
  )
  const options = capabilitiesOf(connectionType).triggers
  const { data: functions = [], isPending: functionsPending } = useQuery({
    ...resourceFunctionsQueryOptions({ connectionResource }),
    enabled: !options.body,
  })
  const toggle = useToggle({ queryKey, run })
  const item =
    snapshot &&
    (triggers.find((row) => triggerKey(row) === triggerKey(snapshot)) ??
      snapshot)
  const mutation = useMutation({
    mutationFn: (draft: TriggerDraft) =>
      run(
        item
          ? recreateTriggerQuery({
              enabled: item.enabled,
              mode: item.enabledMode,
              name: item.name,
              schema: item.schema,
              shape: shapeOf(draft),
              table: item.table,
            })
          : createTriggerQuery({
              schema: draft.schema,
              shape: shapeOf(draft),
              table: draft.table,
            })
      ),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Trigger "${draft.name.trim()}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const schema = triggerSchemas[options.body ? 'body' : 'function']
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? '', connectionType),
    onSubmit: ({ value }) => {
      // The picker narrows the orientation, and a hidden one still has to be legal.
      const allowed = orientationsFor(value, options.orientations)

      mutation.mutate(
        allowed.includes(value.orientation)
          ? value
          : { ...value, orientation: allowed[0] ?? value.orientation }
      )
    },
    onSubmitInvalid: focusInvalidField,
    validators: { onChange: schema, onMount: schema },
  })
  const draft = useStore(form.store, (state) => state.values)

  const readOnly = item
    ? !can.edit || !formEditable(item, options.body)
    : !can.create
  const orientations = orientationsFor(draft, options.orientations)
  const instead = draft.timing === 'INSTEAD OF'
  const targets = (() => {
    if (item) {
      return [item.table]
    }

    return instead ? viewsOf(draft.schema) : tablesOf(draft.schema)
  })()
  const saved = item && shapeOf(draftOf(item, draft.schema, connectionType))
  const changed = !saved || !sameShape(shapeOf(draft), saved)

  return (
    <Inspector
      canSave={changed}
      description={item ? `${item.schema}.${item.table}` : draft.schema}
      form={form}
      item={item}
      mutation={mutation}
      noun="trigger"
      readOnly={readOnly}
      warning={
        item && connectionType === ConnectionType.MySQL
          ? mysqlReplaceWarning({ name: item.name, noun: 'trigger' })
          : undefined
      }
    >
      {item && options.toggle && (
        <InspectorSection title="Status">
          <InspectorOption
            htmlFor="trigger-enabled"
            title="Enabled"
            description="A disabled trigger stays defined but never fires."
          >
            <Switch
              id="trigger-enabled"
              size="sm"
              checked={item.enabled !== false}
              onCheckedChange={(enabled) => toggle.mutate({ enabled, item })}
            />
          </InspectorOption>
        </InspectorSection>
      )}
      <InspectorSection
        title="General"
        description="A trigger runs whenever its table changes."
      >
        <form.AppField name="schema">
          {() => (
            <SchemaField
              disabled={readOnly || !!item}
              schemas={schemas}
              onChanged={() =>
                resetFields(form, { functionName: '', table: '' })
              }
            />
          )}
        </form.AppField>
        <form.AppField name="name">
          {() => <TextField label="Name" autoFocus disabled={readOnly} />}
        </form.AppField>
        <form.AppField name="table">
          {() => (
            <SelectField
              label={instead ? 'View' : 'Table'}
              description={
                instead
                  ? 'An instead-of trigger stands in for writes to a view.'
                  : 'The trigger watches changes on this table.'
              }
              disabled={readOnly || !!item}
              empty={`This schema has no ${instead ? 'views' : 'tables'}.`}
              options={targets}
              placeholder={`Choose a ${instead ? 'view' : 'table'}`}
            />
          )}
        </form.AppField>
      </InspectorSection>
      <InspectorSection
        title="Firing"
        description="Which changes wake the trigger, and when it runs."
      >
        <form.AppField name="events">
          {(field) =>
            options.multipleEvents ? (
              <OptionsField
                label="Events"
                description="Only the events chosen here fire the trigger."
                disabled={readOnly}
                options={options.events}
                placeholder="Choose events"
              />
            ) : (
              <Labelled
                label="Event"
                description="A trigger here answers to a single event."
              >
                <OptionSelect
                  id={field.name}
                  disabled={readOnly}
                  options={options.events}
                  placeholder="Choose an event"
                  value={field.state.value[0] ?? ''}
                  onValueChange={(event: TriggerEvent) =>
                    field.handleChange([event])
                  }
                />
              </Labelled>
            )
          }
        </form.AppField>
        <div className="grid grid-cols-2 gap-3">
          <form.AppField name="timing">
            {() => (
              <SelectField
                label="Timing"
                disabled={readOnly}
                labelOf={sentenceCase}
                options={options.timings}
                placeholder="Timing"
              />
            )}
          </form.AppField>
          {orientations.length > 1 && (
            <form.AppField name="orientation">
              {() => (
                <SelectField
                  label="For each"
                  disabled={readOnly}
                  labelOf={sentenceCase}
                  options={orientations}
                  placeholder="For each"
                />
              )}
            </form.AppField>
          )}
        </div>
      </InspectorSection>
      <InspectorSection
        title="Action"
        description="What the database runs when the trigger fires."
      >
        {options.body ? (
          <form.AppField name="body">
            {() => (
              <BodyField
                label="Body"
                description="Runs for every change the trigger answers to."
                disabled={readOnly}
                language={sqlDialects[connectionType]}
              />
            )}
          </form.AppField>
        ) : (
          <form.AppField name="functionName">
            {() => (
              <SelectField
                label="Function"
                description="Functions in this schema that return a trigger."
                disabled={readOnly}
                empty={
                  functionsPending
                    ? 'Loading…'
                    : 'No function here returns a trigger.'
                }
                options={functions
                  .filter(
                    (fn) =>
                      fn.schema === draft.schema && fn.return_type === 'trigger'
                  )
                  .map((fn) => fn.name)}
                placeholder="Choose a function"
                // The picker only offers this schema, so a pick moves the
                // function off the schema the opened trigger named.
                onChanged={() =>
                  resetFields(form, { functionSchema: draft.schema })
                }
              />
            )}
          </form.AppField>
        )}
      </InspectorSection>
      {item && (
        <InspectorSql
          query={triggerDefinitionQueryOptions({ connectionResource, item })}
        />
      )}
    </Inspector>
  )
}

const columns: DefinitionsColumn<TriggerItem>[] = [
  nameColumn({
    after: (item: TriggerItem) =>
      item.enabled === false && <Badge variant="destructive">Disabled</Badge>,
    icon: () => FlashIcon,
    width: 'w-3/12',
  }),
  textColumn({
    header: 'Table',
    valueOf: (item: TriggerItem) => item.table,
    width: 'w-2/12',
  }),
  labelColumn({
    header: 'Timing',
    labelOf: (item: TriggerItem) => sentenceCase(item.timing),
    width: 'w-2/12',
  }),
  labelColumn({
    header: 'Event',
    labelOf: (item: TriggerItem) =>
      item.event.split(' OR ').map(sentenceCase).join(', '),
    width: 'w-2/12',
  }),
  textColumn({
    header: 'Function',
    valueOf: (item: TriggerItem) => item.functionName,
  }),
]

export const Triggers = () => {
  const state = useDefinitionsState({ section: 'triggers' })
  const { connectionResource, run, search, selectedSchema } = state
  const query = resourceTriggersQueryOptions({ connectionResource })
  const { data: triggers = [], isPending } = useQuery(query)
  const eventFilter = useFilter<string>('All events', [
    { label: 'Insert', value: 'INSERT' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Truncate', value: 'TRUNCATE' },
  ])
  const timingFilter = useFilter<string>('All timings', [
    { label: 'Before', value: 'BEFORE' },
    { label: 'After', value: 'AFTER' },
    { label: 'Instead of', value: 'INSTEAD OF' },
  ])

  const inSchema = triggers.filter((item) => item.schema === selectedSchema)
  const toggle = useToggle({ queryKey: query.queryKey, run })
  const matches = (item: TriggerItem) =>
    // A Postgres trigger lists every event it answers to in one row.
    (eventFilter.value === 'all' || item.event.includes(eventFilter.value)) &&
    timingFilter.matches(item.timing) &&
    matchesSearch(search, item.name, item.table, item.functionName)
  const rowMenu = (item: TriggerItem) =>
    capabilitiesOf(state.type).triggers.toggle
      ? [
          {
            label: item.enabled === false ? 'Enable' : 'Disable',
            onSelect: () =>
              toggle.mutate({ enabled: item.enabled === false, item }),
          },
        ]
      : []

  return (
    <DefinitionsPage
      columns={columns}
      dropItem={(item) =>
        run(
          dropTriggerQuery({
            name: item.name,
            schema: item.schema,
            table: item.table,
          })
        )
      }
      Inspector={TriggerInspector}
      items={inSchema}
      keyOf={triggerKey}
      loading={isPending}
      match={matches}
      queryKey={query.queryKey}
      rowMenu={rowMenu}
      state={state}
      toolbar={
        <>
          {eventFilter.control}
          {timingFilter.control}
        </>
      }
    />
  )
}
