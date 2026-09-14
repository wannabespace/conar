import { FlashIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { uppercaseFirst } from '@tamery/shared/utils/helpers'
import { Badge } from '@tamery/ui/components/badge'
import { Switch } from '@tamery/ui/components/switch'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { customQuery } from '~/entities/connection/queries/connection/custom'
import { triggerDefinitionQueryOptions } from '~/entities/connection/queries/triggers/definition'
import { dropTriggerQuery } from '~/entities/connection/queries/triggers/drop'
import { dropTriggerIfExistsQuery } from '~/entities/connection/queries/triggers/drop-if-exists'
import type { triggersType } from '~/entities/connection/queries/triggers/list'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import { setTriggerEnabledQuery } from '~/entities/connection/queries/triggers/set-enabled'
import { sqlDialects } from '~/entities/connection/utils/monaco'

import {
  DefinitionForm,
  ExistingDefinitionForm,
} from '../-components/definition-form'
import type { FilterOption } from '../-components/filter-select'
import { FilterSelect } from '../-components/filter-select'
import type { SectionInspectorProps } from '../-components/inspector'
import {
  InspectorHeader,
  InspectorOption,
  InspectorSection,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { Muted, monoColumn, nameColumn } from '../-lib/columns'
import { matchesSearch } from '../-lib/search'

type TriggerItem = typeof triggersType.infer

const eventOptions: FilterOption<string>[] = [
  { label: 'All events', value: 'all' },
  { label: 'Insert', value: 'INSERT' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'Truncate', value: 'TRUNCATE' },
]

const timingOptions: FilterOption<string>[] = [
  { label: 'All timings', value: 'all' },
  { label: 'Before', value: 'BEFORE' },
  { label: 'After', value: 'AFTER' },
  { label: 'Instead of', value: 'INSTEAD OF' },
]

const triggerKey = (item: TriggerItem) =>
  `${item.schema}.${item.table}.${item.name}.${item.event}`

const TOGGLE_TYPES = new Set<ConnectionType>([
  ConnectionType.Postgres,
  ConnectionType.MSSQL,
])

const templates: Record<ConnectionType, (schema: string) => string> = {
  clickhouse: () => '',
  mssql: (schema) =>
    `CREATE OR ALTER TRIGGER [${schema}].[new_trigger]\nON [${schema}].[table_name]\nAFTER INSERT\nAS\nBEGIN\n  SET NOCOUNT ON;\nEND`,
  mysql: (schema) =>
    `CREATE TRIGGER \`${schema}\`.\`new_trigger\`\nBEFORE INSERT ON \`${schema}\`.\`table_name\`\nFOR EACH ROW\nBEGIN\n\nEND`,
  postgres: (schema) =>
    `CREATE TRIGGER new_trigger\nBEFORE INSERT ON "${schema}".table_name\nFOR EACH ROW\nEXECUTE FUNCTION "${schema}".function_name();`,
}

type ToggleTrigger = ((item: TriggerItem, enabled: boolean) => void) | undefined

const TriggerInspector = ({
  can,
  connectionResource,
  item: snapshot,
  onOpenChange,
  queryKey,
  rows,
  run,
  selectedSchema,
  toggle,
  type,
}: SectionInspectorProps<TriggerItem> & {
  rows: TriggerItem[]
  toggle: ToggleTrigger
}) => {
  const item =
    snapshot &&
    (rows.find((row) => triggerKey(row) === triggerKey(snapshot)) ?? snapshot)

  return (
    <>
      <InspectorHeader
        description={
          item ? `${item.schema}.${item.table}` : (selectedSchema ?? '')
        }
        title={item ? item.name : 'New trigger'}
      />
      {item && toggle && (
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
              onCheckedChange={(enabled) => toggle(item, enabled)}
            />
          </InspectorOption>
        </InspectorSection>
      )}
      {item ? (
        <ExistingDefinitionForm
          dropFirst={dropTriggerIfExistsQuery({
            name: item.name,
            schema: item.schema,
          })}
          name={item.name}
          noun="trigger"
          onSaved={() => onOpenChange(false)}
          query={triggerDefinitionQueryOptions({ connectionResource, item })}
          queryKey={queryKey}
          readOnly={!can.edit}
          run={run}
          type={type}
        />
      ) : (
        <DefinitionForm
          hint="A trigger names its table, its timing and the function it runs."
          initial={templates[type](selectedSchema ?? '')}
          isNew
          language={sqlDialects[type]}
          onSaved={() => onOpenChange(false)}
          queryKey={queryKey}
          readOnly={!can.create}
          save={(text) => run(customQuery({ query: text }))}
          success="Trigger created"
        />
      )}
    </>
  )
}

const columns: DefinitionsColumn<TriggerItem>[] = [
  nameColumn({
    after: (item: TriggerItem) =>
      item.enabled === false && <Badge variant="destructive">Disabled</Badge>,
    iconOf: () => FlashIcon,
    width: 'w-68',
  }),
  monoColumn({
    header: 'Table',
    valueOf: (item: TriggerItem) => item.table,
    width: 'w-44',
  }),
  {
    cell: (item) => <Muted>{uppercaseFirst(item.timing.toLowerCase())}</Muted>,
    header: 'Timing',
    width: 'w-32',
  },
  {
    cell: (item) => (
      <Muted>
        {item.event
          .split(' OR ')
          .map((event) => uppercaseFirst(event.toLowerCase()))
          .join(', ')}
      </Muted>
    ),
    header: 'Event',
    width: 'w-44',
  },
  monoColumn({
    grow: true,
    header: 'Function',
    valueOf: (item: TriggerItem) => item.functionName,
  }),
]

export const Triggers = () => {
  const state = useDefinitionsState({ section: 'triggers' })
  const { run, search, selectedSchema } = state
  const query = resourceTriggersQueryOptions({
    connectionResource: state.connectionResource,
  })
  const { data: triggers = [], isPending } = useQuery(query)
  const [event, setEvent] = useState('all')
  const [timing, setTiming] = useState('all')

  const inSchema = triggers.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (event === 'all' || item.event.includes(event)) &&
      (timing === 'all' || timing === item.timing) &&
      matchesSearch(search, item.name, item.table, item.functionName)
  )

  const toggleMutation = useDefinitionMutation({
    mutationFn: ({ enabled, item }: { enabled: boolean; item: TriggerItem }) =>
      run(
        setTriggerEnabledQuery({
          enabled,
          name: item.name,
          schema: item.schema,
          table: item.table,
        })
      ),
    queryKey: query.queryKey,
    success: ({ enabled, item }) =>
      `Trigger "${item.name}" ${enabled ? 'enabled' : 'disabled'}`,
  })
  const toggle: ToggleTrigger = TOGGLE_TYPES.has(state.type)
    ? (item, enabled) => toggleMutation.mutate({ enabled, item })
    : undefined

  return (
    <DefinitionsPage
      title="Triggers"
      noun="trigger"
      icon={FlashIcon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={triggerKey}
      nameOf={(item) => item.name}
      columns={columns}
      state={state}
      toolbar={
        <>
          <FilterSelect
            options={eventOptions}
            value={event}
            onValueChange={setEvent}
          />
          <FilterSelect
            options={timingOptions}
            value={timing}
            onValueChange={setTiming}
          />
        </>
      }
      queryKey={query.queryKey}
      dropItem={(item) =>
        run(
          dropTriggerQuery({
            name: item.name,
            schema: item.schema,
            table: item.table,
          })
        )
      }
      rowMenu={(item) =>
        toggle
          ? [
              {
                label: item.enabled === false ? 'Enable' : 'Disable',
                onSelect: () => toggle(item, item.enabled === false),
              },
            ]
          : []
      }
      Inspector={TriggerInspector}
      inspectorProps={{ ...state, rows, toggle }}
    />
  )
}
