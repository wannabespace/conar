import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { matchesSearch } from '@tamery/shared/utils/helpers'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { useQuery } from '@tanstack/react-query'

import { functionDefinitionQueryOptions } from '~/entities/connection/queries/functions/definition'
import { dropFunctionQuery } from '~/entities/connection/queries/functions/drop'
import type { functionsType } from '~/entities/connection/queries/functions/list'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'

import {
  ExistingDefinitionForm,
  NewDefinitionForm,
} from '../-components/definition-form'
import type { SectionInspectorProps } from '../-components/inspector'
import { InspectorHeader } from '../-components/inspector'
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

const dropQueryOf = (item: FunctionItem, cascade: boolean) =>
  dropFunctionQuery({
    cascade,
    identity: item.identity,
    kind: item.type,
    name: item.name,
    schema: item.schema,
  })

const FunctionInspector = ({
  can,
  connectionResource,
  item,
  onOpenChange,
  queryKey,
  run,
  selectedSchema,
  type,
}: SectionInspectorProps<FunctionItem>) => (
  <>
    <InspectorHeader
      description={item?.schema ?? selectedSchema ?? ''}
      item={item}
      noun="function"
    />
    {item ? (
      <ExistingDefinitionForm
        dropQuery={dropQueryOf(item, false)}
        dropsFirst={type === ConnectionType.MySQL}
        name={item.name}
        noun="function"
        onSaved={() => onOpenChange(false)}
        query={functionDefinitionQueryOptions({ connectionResource, item })}
        queryKey={queryKey}
        readOnly={!can.edit}
        run={run}
        type={type}
      />
    ) : (
      <NewDefinitionForm
        noun="function"
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
    run(dropQueryOf(item, cascade))

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
