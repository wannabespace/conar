import { Key01Icon, Link01Icon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  matchesSearch,
  pushUnique,
  sameList,
} from '@tamery/shared/utils/helpers'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { FieldDescription } from '@tamery/ui/components/field'
import { useAppForm } from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { SectionCapabilities } from '~/entities/connection/capabilities'
import { capabilitiesOf } from '~/entities/connection/capabilities'
import { createConstraintQuery } from '~/entities/connection/queries/constraints/create'
import { dropConstraintQuery } from '~/entities/connection/queries/constraints/drop'
import type { constraintsType } from '~/entities/connection/queries/constraints/list'
import { resourceConstraintsQueryOptions } from '~/entities/connection/queries/constraints/list'
import { recreateConstraintQuery } from '~/entities/connection/queries/constraints/recreate'
import { renameConstraintQuery } from '~/entities/connection/queries/constraints/rename'
import type {
  ConstraintKind,
  ConstraintShape,
  ReferentialAction,
} from '~/entities/connection/queries/constraints/shape'
import { REFERENTIAL_ACTIONS } from '~/entities/connection/queries/constraints/shape'
import { structureQueryKey } from '~/entities/connection/queries/indexes/list'
import { resourceTableColumnIdsQueryOptions } from '~/entities/connection/queries/tables/columns'
import { groupInSchema } from '~/entities/connection/utils/helpers'

import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorHeader,
  InspectorDefinition,
  InspectorFooter,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import type { FilterOption } from '../-components/pickers'
import { FilterSelect, NameSelect, NamesSelect } from '../-components/pickers'
import { SchemaField } from '../-components/schema-select'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { nameColumn, textColumn } from '../-lib/columns'

type ConstraintItem = typeof constraintsType.infer

interface GroupedConstraint extends Pick<
  ConstraintItem,
  | 'definition'
  | 'foreignSchema'
  | 'foreignTable'
  | 'name'
  | 'onDelete'
  | 'onUpdate'
  | 'schema'
  | 'table'
  | 'type'
> {
  columns: string[]
  foreignColumns: string[]
}

const typeLabels: Record<ConstraintKind, string> = {
  foreignKey: 'Foreign key',
  primaryKey: 'Primary key',
  unique: 'Unique',
}

const nameSuffix: Record<ConstraintKind, string> = {
  foreignKey: 'fkey',
  primaryKey: 'pkey',
  unique: 'key',
}

const kinds = Object.keys(typeLabels) as ConstraintKind[]

const filterOptions: FilterOption<ConstraintKind | 'all'>[] = [
  { label: 'All types', value: 'all' },
  { label: 'Primary keys', value: 'primaryKey' },
  { label: 'Foreign keys', value: 'foreignKey' },
  { label: 'Unique', value: 'unique' },
]

const DEFAULT_ACTION: ReferentialAction = 'NO ACTION'

const constraintKey = (item: Pick<ConstraintItem, 'name' | 'table'>) =>
  `${item.table}.${item.name}`

const noColumns: readonly string[] = []

const groupConstraints = (
  constraints: ConstraintItem[],
  schema: string | undefined
) =>
  groupInSchema(constraints, schema, {
    key: constraintKey,
    merge: (group: GroupedConstraint, item) => {
      pushUnique(group.columns, item.column)
      pushUnique(group.foreignColumns, item.foreignColumn)
    },
    seed: (item): GroupedConstraint => ({
      ...item,
      columns: [],
      foreignColumns: [],
    }),
  })

const referenceText = (item: GroupedConstraint, schema: string | undefined) => {
  if (!item.foreignTable) {
    return null
  }
  const table =
    item.foreignSchema && item.foreignSchema !== schema
      ? `${item.foreignSchema}.${item.foreignTable}`
      : item.foreignTable

  return `${table} (${item.foreignColumns.join(', ')})`
}

interface ConstraintDraft {
  columns: string[]
  foreignColumns: string[]
  foreignSchema: string
  foreignTable: string
  kind: ConstraintKind
  name: string
  onDelete: ReferentialAction
  onUpdate: ReferentialAction
  schema: string
  table: string
}

const asAction = (value: string | null): ReferentialAction =>
  REFERENTIAL_ACTIONS.find((action) => action === value) ?? DEFAULT_ACTION

const emptyDraft = (schema: string): ConstraintDraft => ({
  columns: [],
  foreignColumns: [],
  foreignSchema: schema,
  foreignTable: '',
  kind: 'unique',
  name: '',
  onDelete: DEFAULT_ACTION,
  onUpdate: DEFAULT_ACTION,
  schema,
  table: '',
})

const draftOf = (
  item: GroupedConstraint | null,
  pageSchema: string
): ConstraintDraft =>
  item
    ? {
        columns: item.columns,
        foreignColumns: item.foreignColumns,
        foreignSchema: item.foreignSchema ?? item.schema,
        foreignTable: item.foreignTable ?? '',
        kind: item.type,
        name: item.name,
        onDelete: asAction(item.onDelete),
        onUpdate: asAction(item.onUpdate),
        schema: item.schema,
        table: item.table,
      }
    : emptyDraft(pageSchema)

const shapeChanged = (draft: ConstraintDraft, item: GroupedConstraint) => {
  const opened = draftOf(item, item.schema)

  return (
    draft.kind !== opened.kind ||
    !sameList(draft.columns, opened.columns) ||
    draft.foreignSchema !== opened.foreignSchema ||
    draft.foreignTable !== opened.foreignTable ||
    !sameList(draft.foreignColumns, opened.foreignColumns) ||
    draft.onDelete !== opened.onDelete ||
    draft.onUpdate !== opened.onUpdate
  )
}

const suggestedNameOf = (draft: ConstraintDraft) =>
  `${draft.table}_${draft.columns.join('_')}_${nameSuffix[draft.kind]}`

const finalNameOf = (draft: ConstraintDraft) =>
  draft.name.trim() || suggestedNameOf(draft)

const renamesInPlace = (
  draft: ConstraintDraft,
  item: GroupedConstraint,
  type: ConnectionType
) =>
  !shapeChanged(draft, item) &&
  finalNameOf(draft) !== item.name &&
  capabilitiesOf(type).renameConstraints

const shapeOf = (draft: ConstraintDraft): ConstraintShape => ({
  columns: draft.columns,
  foreignColumns: draft.foreignColumns,
  foreignSchema: draft.foreignSchema,
  foreignTable: draft.foreignTable,
  kind: draft.kind,
  name: finalNameOf(draft),
  onDelete: draft.onDelete,
  onUpdate: draft.onUpdate,
})

const constraintErrors = (draft: ConstraintDraft) => {
  const isForeign = draft.kind === 'foreignKey'
  const mismatched =
    isForeign &&
    draft.foreignTable !== '' &&
    draft.foreignColumns.length !== draft.columns.length

  return {
    columns:
      draft.columns.length === 0 ? 'Pick at least one column.' : undefined,
    foreignColumns: mismatched
      ? 'Reference one column per column of this constraint.'
      : undefined,
    foreignTable:
      isForeign && draft.foreignTable === ''
        ? 'Pick the table this key points at.'
        : undefined,
    table: draft.table === '' ? 'Pick the table to constrain.' : undefined,
  }
}

const constraintState = ({
  can,
  draft,
  item,
  tables,
  type,
}: {
  can: SectionCapabilities
  draft: ConstraintDraft
  item: GroupedConstraint | null
  tables: string[]
  type: ConnectionType
}) => {
  const changedShape = !!item && shapeChanged(draft, item)
  const renameOnly = !!item && !changedShape && finalNameOf(draft) !== item.name
  const renameInPlace = !!item && renamesInPlace(draft, item, type)
  const readOnly = item ? !can.edit : !can.create

  return {
    changed: item ? changedShape || renameOnly : true,
    description: item ? `${item.schema}.${item.table}` : draft.schema,
    isForeign: draft.kind === 'foreignKey',
    // MySQL names every primary key PRIMARY, whatever the ADD says.
    nameLocked:
      readOnly ||
      (item?.type === 'primaryKey' && type === ConnectionType.MySQL),
    namePlaceholder: draft.table ? suggestedNameOf(draft) : 'Constraint name',
    readOnly,
    renameOnly,
    saveLabel: item ? 'Save' : 'Create constraint',
    recreates: !!item && (changedShape || renameOnly) && !renameInPlace,
    tableOptions: item ? [item.table] : tables,
    title: item ? item.name : 'New constraint',
  }
}

const recreateWarning = (
  item: GroupedConstraint | null,
  renameOnly: boolean
): InspectorWarning => ({
  action: 'Recreate constraint',
  description: renameOnly ? (
    <>
      This database cannot rename a constraint in place, so{' '}
      <span data-mask className="font-medium">
        {item?.name}
      </span>{' '}
      is dropped and added again under the new name. The table is left without
      the rule until the add succeeds.
    </>
  ) : (
    <>
      <span data-mask className="font-medium">
        {item?.name}
      </span>{' '}
      is dropped and added again with the new shape. Rows that break the new
      rule fail the add and nothing is changed.
    </>
  ),
})

const saveConstraint = ({
  draft,
  item,
  run,
  type,
}: {
  draft: ConstraintDraft
  item: GroupedConstraint | null
  run: RunQuery
  type: ConnectionType
}) => {
  const shape = shapeOf(draft)

  if (!item) {
    return run(
      createConstraintQuery({
        schema: draft.schema,
        shape,
        table: draft.table,
      })
    )
  }

  return renamesInPlace(draft, item, type)
    ? run(
        renameConstraintQuery({
          name: item.name,
          newName: shape.name,
          schema: item.schema,
          table: item.table,
        })
      )
    : run(
        recreateConstraintQuery({
          kind: item.type,
          name: item.name,
          schema: item.schema,
          shape,
          table: item.table,
        })
      )
}

const ConstraintInspector = ({
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
}: SectionInspectorProps<GroupedConstraint>) => {
  const mutation = useDefinitionMutation({
    mutationFn: (draft: ConstraintDraft) =>
      saveConstraint({ draft, item, run, type }),
    onSuccess: () => onOpenChange(false),
    queryKey,
    success: (draft) =>
      `Constraint "${finalNameOf(draft)}" ${item ? 'saved' : 'created'}`,
  })
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? ''),
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: {
      onChange: ({ value }) => ({ fields: constraintErrors(value) }),
      onMount: ({ value }) => ({ fields: constraintErrors(value) }),
    },
  })
  const draft = useStore(form.store, (state) => state.values)
  const { data: tableColumns } = useQuery({
    ...resourceTableColumnIdsQueryOptions({
      connectionResource,
      schema: draft.schema,
      table: draft.table,
    }),
    enabled: draft.table !== '',
  })
  const { data: foreignColumns } = useQuery({
    ...resourceTableColumnIdsQueryOptions({
      connectionResource,
      schema: draft.foreignSchema,
      table: draft.foreignTable,
    }),
    enabled: draft.foreignTable !== '',
  })
  const singleColumn = draft.columns.length === 1
  const state = constraintState({
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
          description="A constraint is a rule the database enforces on every write."
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
                  form.setFieldValue('foreignSchema', next, {
                    dontUpdateMeta: true,
                  })
                  form.setFieldValue('foreignTable', '', {
                    dontUpdateMeta: true,
                  })
                  form.setFieldValue('foreignColumns', [], {
                    dontUpdateMeta: true,
                  })
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
                  disabled={state.nameLocked}
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
          <form.AppField name="kind">
            {(field) => (
              <field.Field>
                <field.Label>Type</field.Label>
                <NameSelect
                  id={field.name}
                  disabled={state.readOnly}
                  options={kinds}
                  labelOf={(value) => typeLabels[value]}
                  placeholder="Type"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
                <FieldDescription>
                  A primary key identifies a row, unique rejects duplicates, a
                  foreign key points at another table.
                </FieldDescription>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Target"
          description="The table and the columns this constraint applies to."
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
                  disabled={state.readOnly || draft.table === ''}
                  options={tableColumns}
                  placeholder="Choose columns"
                  value={field.state.value}
                  onValueChange={field.handleChange}
                />
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
        {state.isForeign && (
          <InspectorSection
            title="References"
            description="The rows this key points at, and what happens when one of them changes."
          >
            <form.AppField name="foreignSchema">
              {(field) => (
                <SchemaField
                  id={field.name}
                  disabled={state.readOnly}
                  schema={field.state.value}
                  schemas={schemas}
                  onSchemaChange={(next) => {
                    field.handleChange(next)
                    form.setFieldValue('foreignTable', '', {
                      dontUpdateMeta: true,
                    })
                    form.setFieldValue('foreignColumns', [], {
                      dontUpdateMeta: true,
                    })
                  }}
                />
              )}
            </form.AppField>
            <form.AppField name="foreignTable">
              {(field) => (
                <field.Field>
                  <field.Label>Table</field.Label>
                  <NameSelect
                    id={field.name}
                    disabled={state.readOnly}
                    options={tablesOf(draft.foreignSchema)}
                    placeholder="Choose a table"
                    value={field.state.value}
                    onValueChange={(next) => {
                      field.handleChange(next)
                      form.setFieldValue('foreignColumns', [], {
                        dontUpdateMeta: true,
                      })
                    }}
                  />
                </field.Field>
              )}
            </form.AppField>
            <form.AppField name="foreignColumns">
              {(field) => (
                <field.Field>
                  <field.Label>
                    {singleColumn ? 'Column' : 'Columns'}
                  </field.Label>
                  {singleColumn ? (
                    <NameSelect
                      id={field.name}
                      disabled={state.readOnly || draft.foreignTable === ''}
                      options={foreignColumns ?? noColumns}
                      placeholder="Choose a column"
                      value={field.state.value[0] ?? ''}
                      onValueChange={(next) => field.handleChange([next])}
                    />
                  ) : (
                    <NamesSelect
                      id={field.name}
                      disabled={
                        state.readOnly ||
                        draft.foreignTable === '' ||
                        draft.columns.length === 0
                      }
                      limit={draft.columns.length}
                      options={foreignColumns}
                      placeholder="Choose columns"
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    />
                  )}
                  <FieldDescription>
                    {singleColumn
                      ? 'The column this key points at.'
                      : `${draft.columns.length} referenced columns, one per column of this constraint, in the same order.`}
                  </FieldDescription>
                </field.Field>
              )}
            </form.AppField>
            <div className="grid grid-cols-2 gap-3">
              <form.AppField name="onDelete">
                {(field) => (
                  <field.Field>
                    <field.Label>On delete</field.Label>
                    <NameSelect
                      id={field.name}
                      disabled={state.readOnly}
                      options={capabilitiesOf(type).referentialActions}
                      placeholder="Action"
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    />
                  </field.Field>
                )}
              </form.AppField>
              <form.AppField name="onUpdate">
                {(field) => (
                  <field.Field>
                    <field.Label>On update</field.Label>
                    <NameSelect
                      id={field.name}
                      disabled={state.readOnly}
                      options={capabilitiesOf(type).referentialActions}
                      placeholder="Action"
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    />
                  </field.Field>
                )}
              </form.AppField>
            </div>
            <FieldDescription>
              What the database does to these rows when a referenced row is
              deleted or its key is updated.
            </FieldDescription>
          </InspectorSection>
        )}
        {item?.definition && <InspectorDefinition code={item.definition} />}
      </InspectorSections>
      <InspectorFooter
        canSave={state.changed}
        warning={
          state.recreates ? recreateWarning(item, state.renameOnly) : undefined
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

const columns: DefinitionsColumn<GroupedConstraint>[] = [
  nameColumn({
    icon: (item: GroupedConstraint) =>
      item.type === 'foreignKey' ? Link01Icon : Key01Icon,
    width: 'w-4/12',
  }),
  textColumn({
    header: 'Table',
    valueOf: (item: GroupedConstraint) => item.table,
    width: 'w-2/12',
  }),
  {
    cell: (item, { schema, search }) => {
      const reference = referenceText(item, schema)

      return (
        <span data-mask>
          <HighlightText text={item.columns.join(', ')} match={search} />
          {reference && (
            <span className="text-muted-foreground">
              {' → '}
              <HighlightText text={reference} match={search} />
            </span>
          )}
        </span>
      )
    },
    header: 'Columns',
  },
  {
    align: 'end',
    cell: (item) => (
      <span className="text-muted-foreground">{typeLabels[item.type]}</span>
    ),
    header: 'Type',
    width: 'w-2/12',
  },
]

export const Constraints = () => {
  const state = useDefinitionsState({
    prefetchColumns: true,
    section: 'constraints',
  })
  const { run, search, selectedSchema } = state
  const query = resourceConstraintsQueryOptions({
    connectionResource: state.connectionResource,
  })
  const { data: constraints = [], isPending } = useQuery(query)
  const [type, setType] = useState<ConstraintKind | 'all'>('all')

  const inSchema = groupConstraints(constraints, selectedSchema)
  const rows = inSchema.filter(
    (item) =>
      (type === 'all' || type === item.type) &&
      matchesSearch(
        search,
        item.name,
        item.table,
        item.foreignTable,
        ...item.columns
      )
  )

  return (
    <DefinitionsPage
      title="Constraints"
      noun="constraint"
      icon={Key01Icon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={constraintKey}
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
      queryKey={structureQueryKey(state.connectionResource)}
      dropItem={(item, cascade) =>
        run(
          dropConstraintQuery({
            cascade,
            kind: item.type,
            name: item.name,
            schema: item.schema,
            table: item.table,
          })
        )
      }
      Inspector={ConstraintInspector}
      inspectorProps={state}
    />
  )
}
