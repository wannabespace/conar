import { SourceCodeIcon } from '@hugeicons/core-free-icons'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { customQuery } from '~/entities/connection/queries/connection/custom'
import { functionDefinitionQueryOptions } from '~/entities/connection/queries/functions/definition'
import { dropFunctionQuery } from '~/entities/connection/queries/functions/drop'
import { dropFunctionIfExistsQuery } from '~/entities/connection/queries/functions/drop-if-exists'
import type { functionsType } from '~/entities/connection/queries/functions/list'
import { resourceFunctionsQueryOptions } from '~/entities/connection/queries/functions/list'
import { sqlDialects } from '~/entities/connection/utils/monaco'

import {
  DefinitionForm,
  ExistingDefinitionForm,
} from '../-components/definition-form'
import type { FilterOption } from '../-components/filter-select'
import { FilterSelect } from '../-components/filter-select'
import type { SectionInspectorProps } from '../-components/inspector'
import { InspectorHeader } from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { Muted, monoColumn, nameColumn } from '../-lib/columns'
import { matchesSearch } from '../-lib/search'

type FunctionItem = typeof functionsType.infer
type FunctionType = FunctionItem['type']

const typeLabels: Record<FunctionType, string> = {
  function: 'Function',
  procedure: 'Procedure',
}

const filterOptions: FilterOption<FunctionType | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Functions', value: 'function' },
  { label: 'Procedures', value: 'procedure' },
]

const functionKey = (item: FunctionItem) =>
  `${item.schema}.${item.name}(${item.identity ?? item.argumentCount ?? ''}).${item.type}`

const templates: Record<ConnectionType, (schema: string) => string> = {
  clickhouse: () => '',
  mssql: (schema) =>
    `CREATE OR ALTER FUNCTION [${schema}].[new_function]()\nRETURNS INT\nAS\nBEGIN\n  RETURN 0;\nEND`,
  mysql: (schema) =>
    `CREATE FUNCTION \`${schema}\`.\`new_function\`()\nRETURNS INT\nDETERMINISTIC\nBEGIN\n  RETURN 0;\nEND`,
  postgres: (schema) =>
    `CREATE OR REPLACE FUNCTION "${schema}".new_function()\nRETURNS void\nLANGUAGE plpgsql\nAS $$\nBEGIN\n\nEND;\n$$;`,
}

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
      description={item ? item.schema : (selectedSchema ?? '')}
      title={item ? item.name : 'New function'}
    />
    {item ? (
      <ExistingDefinitionForm
        dropFirst={dropFunctionIfExistsQuery({
          kind: item.type,
          name: item.name,
          schema: item.schema,
        })}
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
      <DefinitionForm
        hint="A function declares its arguments, what it returns and its body."
        initial={templates[type](selectedSchema ?? '')}
        isNew
        language={sqlDialects[type]}
        onSaved={() => onOpenChange(false)}
        queryKey={queryKey}
        readOnly={!can.create}
        save={(text) => run(customQuery({ query: text }))}
        success="Function created"
      />
    )}
  </>
)

const columns: DefinitionsColumn<FunctionItem>[] = [
  nameColumn({ iconOf: () => SourceCodeIcon, width: 'w-68' }),
  {
    cell: (item, { search }) => (
      <Muted>
        {item.language && <HighlightText text={item.language} match={search} />}
      </Muted>
    ),
    header: 'Language',
    width: 'w-32',
  },
  monoColumn({
    grow: true,
    header: 'Returns',
    valueOf: (item: FunctionItem) => item.return_type,
  }),
  {
    align: 'end',
    cell: (item) => (
      <Muted>
        <span className="tabular-nums">{item.argumentCount ?? 0}</span>
      </Muted>
    ),
    header: 'Arguments',
    width: 'w-28',
  },
  {
    align: 'end',
    cell: (item) => <Muted>{typeLabels[item.type]}</Muted>,
    header: 'Type',
    width: 'w-36',
  },
]

export const Functions = () => {
  const state = useDefinitionsState({ section: 'functions' })
  const { run, search, selectedSchema } = state
  const query = resourceFunctionsQueryOptions({
    connectionResource: state.connectionResource,
  })
  const { data: functions = [], isPending } = useQuery(query)
  const [type, setType] = useState<FunctionType | 'all'>('all')

  const inSchema = functions.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (type === 'all' || type === item.type) &&
      matchesSearch(search, item.name, item.language, item.return_type)
  )

  return (
    <DefinitionsPage
      title="Functions"
      noun="function"
      icon={SourceCodeIcon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={functionKey}
      columns={columns}
      state={state}
      toolbar={
        <FilterSelect
          options={filterOptions}
          value={type}
          onValueChange={setType}
        />
      }
      canCascade
      queryKey={query.queryKey}
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
      inspectorProps={state}
    />
  )
}
