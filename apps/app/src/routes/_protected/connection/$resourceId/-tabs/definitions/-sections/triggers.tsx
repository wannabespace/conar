import { FlashIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch, uppercaseFirst } from '@tamery/shared/utils/helpers'
import { Badge } from '@tamery/ui/components/badge'
import { Switch } from '@tamery/ui/components/switch'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { connectionVersionQueryOptions } from '~/entities/connection/queries/connection/version'
import { triggerDefinitionQueryOptions } from '~/entities/connection/queries/triggers/definition'
import {
  dropTriggerQuery,
  dropTriggerStatements,
} from '~/entities/connection/queries/triggers/drop'
import type { triggersType } from '~/entities/connection/queries/triggers/list'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import { setTriggerEnabledQuery } from '~/entities/connection/queries/triggers/set-enabled'
import { queryClient } from '~/lib/query-client'

import {
  ExistingDefinitionForm,
  NewDefinitionForm,
} from '../-components/definition-form'
import type { SectionInspectorProps } from '../-components/inspector'
import {
  InspectorHeader,
  InspectorOption,
  InspectorSection,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { useFilter } from '../-hooks/use-filter'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, nameColumn, textColumn } from '../-lib/columns'

type TriggerItem = typeof triggersType.infer

const triggerKey = (item: TriggerItem) =>
  `${item.schema}.${item.table}.${item.name}.${item.event}`

const sentenceCase = (value: string) => uppercaseFirst(value.toLowerCase())

const dropParamsOf = (item: TriggerItem) => ({
  name: item.name,
  schema: item.schema,
  table: item.table,
})

// CREATE OR REPLACE TRIGGER arrived in PostgreSQL 14; MySQL never had one.
const REPLACES_TRIGGERS_FROM = 14

// Postgres and MSSQL can park a trigger without dropping it; the others
// cannot, so they get no toggle at all.
const TOGGLES = new Set<ConnectionType>([
  ConnectionType.Postgres,
  ConnectionType.MSSQL,
])

const useToggle = ({
  queryKey,
  run,
  type,
}: Pick<SectionInspectorProps<TriggerItem>, 'queryKey' | 'run' | 'type'>) => {
  const mutation = useMutation({
    mutationFn: ({ enabled, item }: { enabled: boolean; item: TriggerItem }) =>
      run(
        setTriggerEnabledQuery({
          enabled,
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

  return TOGGLES.has(type)
    ? (item: TriggerItem, enabled: boolean) =>
        mutation.mutate({ enabled, item })
    : undefined
}

const useDropsFirst = ({
  connection,
  type,
}: Pick<SectionInspectorProps<TriggerItem>, 'connection' | 'type'>) => {
  const { data: version } = useQuery({
    ...connectionVersionQueryOptions(connection),
    enabled: type === ConnectionType.Postgres,
  })

  if (type !== ConnectionType.Postgres) {
    return type === ConnectionType.MySQL
  }

  return version === undefined
    ? undefined
    : Number(version.split('.')[0]) < REPLACES_TRIGGERS_FROM
}

const TriggerInspector = ({
  can,
  connection,
  connectionResource,
  item: snapshot,
  onOpenChange,
  queryKey,
  run,
  selectedSchema,
  type,
}: SectionInspectorProps<TriggerItem>) => {
  const { data: triggers = [] } = useQuery(
    resourceTriggersQueryOptions({ connectionResource })
  )
  const toggle = useToggle({ queryKey, run, type })
  const dropsFirst = useDropsFirst({ connection, type })
  const item =
    snapshot &&
    (triggers.find((row) => triggerKey(row) === triggerKey(snapshot)) ??
      snapshot)

  return (
    <>
      <InspectorHeader
        description={
          item ? `${item.schema}.${item.table}` : (selectedSchema ?? '')
        }
        item={item}
        noun="trigger"
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
          dropStatements={dropTriggerStatements(dropParamsOf(item))}
          dropsFirst={dropsFirst}
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
        <NewDefinitionForm
          noun="trigger"
          onSaved={() => onOpenChange(false)}
          queryKey={queryKey}
          readOnly={!can.create}
          run={run}
          schema={selectedSchema ?? ''}
          type={type}
        />
      )}
    </>
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
  const toggle = useToggle({ queryKey: query.queryKey, run, type: state.type })
  const matches = (item: TriggerItem) =>
    // A Postgres trigger lists every event it answers to in one row.
    (eventFilter.value === 'all' || item.event.includes(eventFilter.value)) &&
    timingFilter.matches(item.timing) &&
    matchesSearch(search, item.name, item.table, item.functionName)
  const dropItem = (item: TriggerItem) =>
    run(dropTriggerQuery(dropParamsOf(item)))
  const rowMenu = (item: TriggerItem) =>
    toggle
      ? [
          {
            label: item.enabled === false ? 'Enable' : 'Disable',
            onSelect: () => toggle(item, item.enabled === false),
          },
        ]
      : []

  return (
    <DefinitionsPage
      columns={columns}
      dropItem={dropItem}
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
