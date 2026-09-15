import {
  ArrowRight01Icon,
  Key01Icon,
  LeftToRightListDashIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import { FieldDescription } from '@tamery/ui/components/field'
import { Switch } from '@tamery/ui/components/switch'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'

import { Link } from '~/components/link'
import type { SectionCapabilities } from '~/entities/connection/capabilities'
import { createIndexQuery } from '~/entities/connection/queries/indexes/create'
import { dropIndexQuery } from '~/entities/connection/queries/indexes/drop'
import type { indexesType } from '~/entities/connection/queries/indexes/list'
import {
  resourceIndexesQueryOptions,
  structureQueryKey,
} from '~/entities/connection/queries/indexes/list'
import { recreateIndexQuery } from '~/entities/connection/queries/indexes/recreate'
import { renameIndexQuery } from '~/entities/connection/queries/indexes/rename'
import { resourceTableColumnIdsQueryOptions } from '~/entities/connection/queries/tables/columns'
import { definitionsTabId } from '~/entities/connection/store/tabs/ids'

import type { FilterOption } from '../-components/filter-select'
import { FilterSelect } from '../-components/filter-select'
import type { SectionInspectorProps } from '../-components/inspector'
import {
  InspectorDefinition,
  InspectorFooter,
  InspectorHeader,
  InspectorOption,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { NameSelect, NamesSelect } from '../-components/pickers'
import { SchemaField } from '../-components/schema-select'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { HighlightList, Muted, monoColumn, nameColumn } from '../-lib/columns'
import { sameList } from '../-lib/lists'
import { matchesSearch } from '../-lib/search'

type IndexItem = typeof indexesType.infer
type IndexKind = 'primary' | 'unique' | 'regular'

interface GroupedIndex extends Pick<
  IndexItem,
  | 'constraintOwned'
  | 'custom'
  | 'definition'
  | 'name'
  | 'schema'
  | 'table'
  | 'type'
> {
  columns: string[]
  kind: IndexKind
}

const kindOf = (item: IndexItem): IndexKind => {
  if (item.isPrimary) {
    return 'primary'
  }
  return item.isUnique ? 'unique' : 'regular'
}

const kindLabels: Record<IndexKind, string> = {
  primary: 'Primary key',
  regular: 'Index',
  unique: 'Unique',
}

const filterOptions: FilterOption<IndexKind | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Primary keys', value: 'primary' },
  { label: 'Unique', value: 'unique' },
  { label: 'Regular', value: 'regular' },
]

const indexKey = (item: Pick<IndexItem, 'name' | 'table'>) =>
  `${item.table}.${item.name}`

const typeText = (item: GroupedIndex) =>
  item.type ? `${kindLabels[item.kind]} · ${item.type}` : kindLabels[item.kind]

const groupIndexes = (indexes: IndexItem[], schema: string | undefined) => {
  const grouped = new Map<string, GroupedIndex>()

  for (const item of indexes) {
    if (item.schema !== schema) {
      continue
    }
    const key = indexKey(item)
    const column = item.column ?? item.customExpression
    const existing = grouped.get(key)

    if (existing) {
      if (column && !existing.columns.includes(column)) {
        existing.columns.push(column)
      }
      existing.custom ||= item.custom
    } else {
      grouped.set(key, {
        columns: column ? [column] : [],
        constraintOwned: item.constraintOwned,
        custom: item.custom,
        definition: item.definition,
        kind: kindOf(item),
        name: item.name,
        schema: item.schema,
        table: item.table,
        type: item.type,
      })
    }
  }

  return [...grouped.values()]
}

// A constraint's index is renamed along with the constraint by PostgreSQL and
// SQL Server; MySQL calls every primary key PRIMARY.
const RENAMES_OWNED = new Set<ConnectionType>([
  ConnectionType.Postgres,
  ConnectionType.MSSQL,
])

interface IndexDraft {
  columns: string[]
  name: string
  schema: string
  table: string
  unique: boolean
}

const suggestedNameOf = (draft: IndexDraft) =>
  `${draft.table}_${draft.columns.join('_')}_idx`

const finalNameOf = (draft: IndexDraft) =>
  draft.name.trim() || suggestedNameOf(draft)

const shapeChangedOf = (draft: IndexDraft, item: GroupedIndex | null) =>
  !!item &&
  (!sameList(draft.columns, item.columns) ||
    draft.unique !== (item.kind !== 'regular'))

const saveIndex = ({
  draft,
  item,
  run,
}: {
  draft: IndexDraft
  item: GroupedIndex | null
  run: RunQuery
}) => {
  const name = finalNameOf(draft)

  if (!item) {
    return run(
      createIndexQuery({
        columns: draft.columns,
        name,
        schema: draft.schema,
        table: draft.table,
        unique: draft.unique,
      })
    )
  }

  return shapeChangedOf(draft, item)
    ? run(
        recreateIndexQuery({
          columns: draft.columns,
          name: item.name,
          newName: name,
          schema: item.schema,
          table: item.table,
          unique: draft.unique,
        })
      )
    : run(
        renameIndexQuery({
          name: item.name,
          newName: name,
          schema: item.schema,
          table: item.table,
        })
      )
}

const indexErrors = (draft: IndexDraft) => ({
  columns: draft.columns.length === 0 ? 'Pick at least one column.' : undefined,
  table: draft.table === '' ? 'Pick the table to index.' : undefined,
})

const indexState = ({
  can,
  draft,
  item,
  tables,
  type,
}: {
  can: SectionCapabilities
  draft: IndexDraft
  item: GroupedIndex | null
  tables: string[]
  type: ConnectionType
}) => {
  const shapeChanged = shapeChangedOf(draft, item)
  const owned = !!item?.constraintOwned
  const custom = !!item?.custom
  const readOnly = item
    ? !can.edit || (owned && !RENAMES_OWNED.has(type))
    : !can.create

  return {
    changed: item ? finalNameOf(draft) !== item.name || shapeChanged : true,
    custom,
    description: item ? `${item.schema}.${item.table}` : draft.schema,
    namePlaceholder: draft.table ? suggestedNameOf(draft) : 'Index name',
    owned,
    readOnly,
    saveLabel: item ? 'Save' : 'Create index',
    shapeChanged,
    shapeLocked: readOnly || custom || owned,
    tableOptions: item ? [item.table] : tables,
    title: item ? item.name : 'New index',
  }
}

const IndexNotes = ({
  constraintKey,
  custom,
  onLeave,
  owned,
  resourceId,
  schema,
}: {
  constraintKey: string | undefined
  custom: boolean
  onLeave: () => void
  owned: boolean
  resourceId: string
  schema: string | undefined
}) => (
  <AnimatePresence initial={false}>
    {custom && (
      <MotionCollapse gap={16} key="custom">
        <FieldDescription>
          Built with an expression, method, predicate or ordering the picker
          cannot show, so only its name can change.
        </FieldDescription>
      </MotionCollapse>
    )}
    {owned && (
      <MotionCollapse gap={16} key="owned">
        <FieldDescription>
          This index enforces a constraint, which owns its columns.{' '}
          <Link
            to="/connection/$resourceId/$tabId"
            params={{
              resourceId,
              tabId: definitionsTabId('constraints'),
            }}
            search={{ open: constraintKey, schema }}
            onClick={onLeave}
            className="text-primary font-medium hover:underline"
          >
            Open in Constraints
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="ml-0.5 inline size-3.5 align-[-2px]"
            />
          </Link>
        </FieldDescription>
      </MotionCollapse>
    )}
  </AnimatePresence>
)

const IndexInspector = ({
  can,
  connectionResource,
  item,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  tablesOf,
  type,
}: SectionInspectorProps<GroupedIndex>) => {
  const mutation = useDefinitionMutation({
    mutationFn: (draft: IndexDraft) => saveIndex({ draft, item, run }),
    onSuccess: () => onOpenChange(false),
    queryKey,
    success: (draft) => `Index "${finalNameOf(draft)}" saved`,
  })
  const form = useAppForm({
    defaultValues: {
      columns: item?.columns ?? [],
      name: item?.name ?? '',
      schema: item?.schema ?? selectedSchema ?? '',
      table: item?.table ?? '',
      unique: item ? item.kind !== 'regular' : false,
    } satisfies IndexDraft,
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: {
      onChange: ({ value }) => ({ fields: indexErrors(value) }),
      onMount: ({ value }) => ({ fields: indexErrors(value) }),
    },
  })
  const draft = useStore(form.store, (state) => state.values)
  const { data: columnNames } = useQuery({
    ...resourceTableColumnIdsQueryOptions({
      connectionResource,
      schema: draft.schema,
      table: draft.table,
    }),
    enabled: draft.table !== '',
  })
  const state = indexState({
    can,
    draft,
    item,
    tables: tablesOf(draft.schema),
    type,
  })

  return (
    <>
      <InspectorHeader description={state.description} title={state.title} />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="An index speeds up lookups on the columns it covers."
        >
          <form.AppField name="schema">
            {(field) => (
              <SchemaField
                id={field.name}
                disabled={state.readOnly || !!item}
                schema={field.state.value}
                schemas={schemas}
                onSchemaChange={(next) => {
                  field.handleChange(next)
                  form.setFieldValue('table', '', { dontUpdateMeta: true })
                  form.setFieldValue('columns', [], { dontUpdateMeta: true })
                }}
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => (
              <field.Field>
                <field.Label>Name</field.Label>
                <field.Input
                  data-mask
                  autoFocus
                  disabled={state.readOnly}
                  placeholder={state.namePlaceholder}
                  spellCheck={false}
                  autoComplete="off"
                />
                <FieldDescription>
                  Leave it empty to use the suggested name.
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Target"
          description="The table and the columns this index covers, in order."
        >
          <form.AppField name="table">
            {(field) => (
              <field.Field>
                <field.Label>Table</field.Label>
                <NameSelect
                  id={field.name}
                  disabled={state.readOnly || !!item}
                  options={state.tableOptions}
                  placeholder="Choose a table"
                  value={field.state.value}
                  onValueChange={(next) => {
                    field.handleChange(next)
                    form.setFieldValue('columns', [], { dontUpdateMeta: true })
                  }}
                />
              </field.Field>
            )}
          </form.AppField>
          <form.AppField name="columns">
            {(field) => (
              <field.Field>
                <field.Label>Columns</field.Label>
                <NamesSelect
                  id={field.name}
                  disabled={state.shapeLocked || draft.table === ''}
                  options={columnNames}
                  placeholder="Choose columns"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
                <FieldDescription>
                  A query uses the index when it filters on the leading columns.
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
          <IndexNotes
            constraintKey={item ? indexKey(item) : undefined}
            custom={state.custom}
            onLeave={() => onOpenChange(false)}
            owned={state.owned}
            resourceId={connectionResource.id}
            schema={draft.schema}
          />
        </InspectorSection>
        <InspectorSection title="Options">
          <form.AppField name="unique">
            {(field) => (
              <InspectorOption
                htmlFor="index-unique"
                title="Unique"
                description="Rejects rows repeating a value across the chosen columns."
              >
                <Switch
                  id="index-unique"
                  size="sm"
                  disabled={state.shapeLocked}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </InspectorOption>
            )}
          </form.AppField>
        </InspectorSection>
        {item?.definition && <InspectorDefinition code={item.definition} />}
      </InspectorSections>
      <InspectorFooter
        canSave={state.changed}
        warning={
          state.shapeChanged
            ? {
                action: 'Rebuild index',
                description: (
                  <>
                    <span data-mask className="font-medium">
                      {item?.name}
                    </span>{' '}
                    is dropped and built again with the new shape. Queries run
                    unindexed while it builds, and a unique index fails to
                    rebuild if duplicate rows appeared.
                  </>
                ),
              }
            : undefined
        }
        error={mutation.error}
        form={form}
        readOnly={state.readOnly}
        saveLabel={state.saveLabel}
        saving={mutation.isPending}
      />
    </>
  )
}

const columns: DefinitionsColumn<GroupedIndex>[] = [
  nameColumn({
    iconOf: (item: GroupedIndex) =>
      item.kind === 'primary' ? Key01Icon : LeftToRightListDashIcon,
    width: 'w-88',
  }),
  monoColumn({
    header: 'Table',
    valueOf: (item: GroupedIndex) => item.table,
    width: 'w-48',
  }),
  {
    cell: (item, { search }) => (
      <span data-mask className="font-mono">
        <HighlightList values={item.columns} match={search} />
      </span>
    ),
    className: 'whitespace-normal',
    grow: true,
    header: 'Columns',
  },
  {
    align: 'end',
    cell: (item) => <Muted>{typeText(item)}</Muted>,
    header: 'Type',
    width: 'w-44',
  },
]

export const Indexes = () => {
  const state = useDefinitionsState({
    prefetchColumns: true,
    section: 'indexes',
  })
  const { run, search, selectedSchema } = state
  const query = resourceIndexesQueryOptions({
    connectionResource: state.connectionResource,
  })
  const { data: indexes = [], isPending } = useQuery(query)
  const [kind, setKind] = useState<IndexKind | 'all'>('all')

  const inSchema = groupIndexes(indexes, selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (kind === 'all' || kind === item.kind) &&
      matchesSearch(search, item.name, item.table, ...item.columns)
  )

  return (
    <DefinitionsPage
      title="Indexes"
      noun="index"
      icon={LeftToRightListDashIcon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={indexKey}
      columns={columns}
      state={state}
      toolbar={
        <FilterSelect
          options={filterOptions}
          value={kind}
          onValueChange={setKind}
        />
      }
      canDropItem={(item) => !item.constraintOwned}
      queryKey={structureQueryKey(state.connectionResource)}
      dropItem={(item) =>
        run(
          dropIndexQuery({
            name: item.name,
            schema: item.schema,
            table: item.table,
          })
        )
      }
      Inspector={IndexInspector}
      inspectorProps={state}
    />
  )
}
