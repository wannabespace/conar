import {
  ArrowRight01Icon,
  FlashIcon,
  PauseIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { matchesSearch } from '@tamery/shared/utils'
import { Badge } from '@tamery/ui/components/badge'
import { useQuery } from '@tanstack/react-query'

import { Link } from '~/components/link'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import { dropTriggerQuery } from '~/entities/connection/queries/triggers/drop'
import { resourceTriggersQueryOptions } from '~/entities/connection/queries/triggers/list'
import { definitionsTabId } from '~/entities/connection/store/tabs/ids'

import { DefinitionsPage } from '../../-components/page'
import { useDefinitionsState } from '../../-hooks/use-definitions-state'
import { useFilter } from '../../-hooks/use-filter'
import type { DefinitionsColumn } from '../../-lib/columns'
import { labelColumn, nameColumn, textColumn } from '../../-lib/columns'
import type { TriggerItem } from './trigger-draft'
import { sentenceCase } from './trigger-draft'
import { TriggerInspector } from './trigger-inspector'
import { useToggle } from './use-toggle'

export const triggerKey = (item: TriggerItem) =>
  JSON.stringify([item.schema, item.table, item.name, item.event])

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
]

const functionColumn = textColumn({
  header: 'Function',
  valueOf: (item: TriggerItem) => item.functionName,
})

export const Triggers = () => {
  const state = useDefinitionsState({ section: 'triggers' })
  const { connectionResource, relationNamesOf, run, search, selectedSchema } =
    state
  const options = capabilitiesOf(state.type).triggers
  const query = resourceTriggersQueryOptions({ connectionResource })
  const { data: triggers = [], isPending } = useQuery(query)
  const { data: functions = [], isPending: functionsPending } = useQuery({
    ...resourceFunctionsQueryOptions({ connectionResource }),
    enabled: !options.body,
  })
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
  const schema = selectedSchema ?? ''
  const watchable = ['table' as const, ...options.insteadOfTargets].some(
    (kind) => relationNamesOf(schema, kind).length > 0
  )
  const createBlocked = (() => {
    if (!watchable) {
      return 'This schema has no tables to watch.'
    }

    const hasTriggerFunction = functions.some(
      (fn) => fn.schema === schema && fn.return_type === 'trigger'
    )

    return options.body ||
      functionsPending ||
      hasTriggerFunction ? undefined : (
      <>
        A trigger runs a function, and none here returns a trigger.{' '}
        <Link
          to="/connection/$resourceId/$tabId"
          params={{
            resourceId: connectionResource.id,
            tabId: definitionsTabId('functions'),
          }}
          search={{ create: 'trigger', schema }}
          className="text-primary font-medium hover:underline"
        >
          Create trigger function
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="ml-0.5 inline size-3.5 align-[-2px]"
          />
        </Link>
      </>
    )
  })()
  const rowMenu = (item: TriggerItem) =>
    options.toggle
      ? [
          {
            label: item.enabled === false ? 'Enable' : 'Disable',
            icon: item.enabled === false ? PlayIcon : PauseIcon,
            onSelect: () =>
              toggle.mutate({ enabled: item.enabled === false, item }),
          },
        ]
      : []

  return (
    <DefinitionsPage
      columns={options.body ? columns : [...columns, functionColumn]}
      createBlocked={createBlocked}
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
