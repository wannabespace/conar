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
import { useMutation, useQuery } from '@tanstack/react-query'
import { type as arkType } from 'arktype'
import { toast } from 'sonner'

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
import { queryClient } from '~/lib/query-client'

import {
  Labelled,
  OptionSelect,
  OptionsField,
  resetFields,
  SchemaField,
  SelectField,
  TextField,
} from '../-components/fields'
import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorDefinition,
  InspectorFooter,
  InspectorHeader,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import { useFilter } from '../-hooks/use-filter'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, nameColumn, textColumn } from '../-lib/columns'

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

const referenceOf = (item: GroupedConstraint, schema: string | undefined) => {
  const table =
    item.foreignSchema && item.foreignSchema !== schema
      ? `${item.foreignSchema}.${item.foreignTable}`
      : item.foreignTable

  return `${table} (${item.foreignColumns.join(', ')})`
}

const asAction = (value: string | null): ReferentialAction =>
  REFERENTIAL_ACTIONS.find((action) => action === value) ?? DEFAULT_ACTION

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
    : {
        columns: [],
        foreignColumns: [],
        foreignSchema: pageSchema,
        foreignTable: '',
        kind: 'unique',
        name: '',
        onDelete: DEFAULT_ACTION,
        onUpdate: DEFAULT_ACTION,
        schema: pageSchema,
        table: '',
      }

const reshapes = (draft: ConstraintDraft, item: GroupedConstraint) => {
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
  [draft.table, ...draft.columns, nameSuffix[draft.kind]].join('_')

const finalNameOf = (draft: ConstraintDraft) =>
  draft.name.trim() || suggestedNameOf(draft)

const renamesInPlace = (
  draft: ConstraintDraft,
  item: GroupedConstraint,
  type: ConnectionType
) =>
  !reshapes(draft, item) &&
  finalNameOf(draft) !== item.name &&
  capabilitiesOf(type).renameConstraints

const constraintSchema = arkType({
  columns: arkType('string[] >= 1').configure({
    message: 'Pick at least one column.',
  }),
  foreignColumns: 'string[]',
  foreignTable: 'string',
  kind: 'string',
  table: arkType(/\S/u).configure({
    message: 'Pick the table to constrain.',
  }),
}).narrow((draft, ctx) => {
  if (draft.kind !== 'foreignKey') {
    return true
  }

  if (draft.foreignTable === '') {
    return ctx.reject({
      message: 'Pick the table this key points at.',
      relativePath: ['foreignTable'],
    })
  }

  return (
    draft.foreignColumns.length === draft.columns.length ||
    ctx.reject({
      message: 'Reference one column per column of this constraint.',
      relativePath: ['foreignColumns'],
    })
  )
})

const recreateWarning = (
  item: GroupedConstraint,
  renameOnly: boolean
): InspectorWarning => ({
  action: 'Recreate constraint',
  description: renameOnly ? (
    <>
      No rename in place here, so we drop{' '}
      <span data-mask className="font-medium">
        {item.name}
      </span>{' '}
      and add it back renamed. Nothing enforces it in between.
    </>
  ) : (
    <>
      We drop{' '}
      <span data-mask className="font-medium">
        {item.name}
      </span>{' '}
      and add it back reshaped. A row breaking the new rule fails the add.
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
  const shape: ConstraintShape = {
    columns: draft.columns,
    foreignColumns: draft.foreignColumns,
    foreignSchema: draft.foreignSchema,
    foreignTable: draft.foreignTable,
    kind: draft.kind,
    name: finalNameOf(draft),
    onDelete: draft.onDelete,
    onUpdate: draft.onUpdate,
  }

  if (!item) {
    return run(
      createConstraintQuery({ schema: draft.schema, shape, table: draft.table })
    )
  }
  const target = { name: item.name, schema: item.schema, table: item.table }

  return renamesInPlace(draft, item, type)
    ? run(renameConstraintQuery({ ...target, newName: shape.name }))
    : run(recreateConstraintQuery({ ...target, kind: item.type, shape }))
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
  const mutation = useMutation({
    mutationFn: (draft: ConstraintDraft) =>
      saveConstraint({ draft, item, run, type }),
    onSuccess: async (_result, draft) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(
        `Constraint "${finalNameOf(draft)}" ${item ? 'saved' : 'created'}`
      )
      onOpenChange(false)
    },
  })
  const form = useAppForm({
    defaultValues: draftOf(item, selectedSchema ?? ''),
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: { onChange: constraintSchema, onMount: constraintSchema },
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

  const readOnly = item ? !can.edit : !can.create
  const reshaped = !!item && reshapes(draft, item)
  const renameOnly = !!item && !reshaped && finalNameOf(draft) !== item.name
  const recreates =
    !!item && (reshaped || renameOnly) && !renamesInPlace(draft, item, type)
  const singleColumn = draft.columns.length === 1

  return (
    <>
      <InspectorHeader
        description={item ? `${item.schema}.${item.table}` : draft.schema}
        item={item}
        noun="constraint"
      />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="A constraint is a rule the database enforces on every write."
        >
          <form.AppField name="schema">
            {() => (
              <SchemaField
                disabled={readOnly || !!item}
                schemas={schemas}
                onChanged={(next) =>
                  resetFields(form, {
                    columns: [],
                    foreignColumns: [],
                    foreignSchema: next,
                    foreignTable: '',
                    table: '',
                  })
                }
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {() => (
              <TextField
                label="Name"
                autoFocus
                description="Leave it empty to use the suggested name."
                // MySQL names every primary key PRIMARY, whatever the ADD says.
                disabled={
                  readOnly ||
                  (item?.type === 'primaryKey' && type === ConnectionType.MySQL)
                }
                placeholder={
                  draft.table ? suggestedNameOf(draft) : 'Constraint name'
                }
              />
            )}
          </form.AppField>
          <form.AppField name="kind">
            {() => (
              <SelectField
                label="Type"
                description="A primary key identifies a row, unique rejects duplicates, a foreign key points at another table."
                disabled={readOnly}
                options={kinds}
                labelOf={(value) => typeLabels[value]}
                placeholder="Type"
              />
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Target"
          description="The table and the columns this constraint applies to."
        >
          <form.AppField name="table">
            {() => (
              <SelectField
                label="Table"
                disabled={readOnly || !!item}
                options={item ? [item.table] : tablesOf(draft.schema)}
                placeholder="Choose a table"
                onChanged={() => resetFields(form, { columns: [] })}
              />
            )}
          </form.AppField>
          <form.AppField name="columns">
            {() => (
              <OptionsField
                label="Columns"
                disabled={readOnly || draft.table === ''}
                options={tableColumns}
                placeholder="Choose columns"
              />
            )}
          </form.AppField>
        </InspectorSection>
        {draft.kind === 'foreignKey' && (
          <InspectorSection
            title="References"
            description="The rows this key points at, and what happens when one of them changes."
          >
            <form.AppField name="foreignSchema">
              {() => (
                <SchemaField
                  disabled={readOnly}
                  schemas={schemas}
                  onChanged={() =>
                    resetFields(form, {
                      foreignColumns: [],
                      foreignTable: '',
                    })
                  }
                />
              )}
            </form.AppField>
            <form.AppField name="foreignTable">
              {() => (
                <SelectField
                  label="Table"
                  disabled={readOnly}
                  options={tablesOf(draft.foreignSchema)}
                  placeholder="Choose a table"
                  onChanged={() => resetFields(form, { foreignColumns: [] })}
                />
              )}
            </form.AppField>
            <form.AppField name="foreignColumns">
              {(field) =>
                singleColumn ? (
                  <Labelled
                    label="Column"
                    description="The column this key points at."
                  >
                    <OptionSelect
                      id={field.name}
                      disabled={readOnly || draft.foreignTable === ''}
                      options={foreignColumns ?? noColumns}
                      placeholder="Choose a column"
                      value={field.state.value[0] ?? ''}
                      onValueChange={(next) => field.handleChange([next])}
                    />
                  </Labelled>
                ) : (
                  <OptionsField
                    label="Columns"
                    description={`${draft.columns.length} referenced columns, one per column of this constraint, in the same order.`}
                    disabled={
                      readOnly ||
                      draft.foreignTable === '' ||
                      draft.columns.length === 0
                    }
                    limit={draft.columns.length}
                    options={foreignColumns}
                    placeholder="Choose columns"
                  />
                )
              }
            </form.AppField>
            <div className="grid grid-cols-2 gap-3">
              <form.AppField name="onDelete">
                {() => (
                  <SelectField
                    label="On delete"
                    disabled={readOnly}
                    options={capabilitiesOf(type).referentialActions}
                    placeholder="Action"
                  />
                )}
              </form.AppField>
              <form.AppField name="onUpdate">
                {() => (
                  <SelectField
                    label="On update"
                    disabled={readOnly}
                    options={capabilitiesOf(type).referentialActions}
                    placeholder="Action"
                  />
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
        canSave={!item || reshaped || renameOnly}
        warning={
          item && recreates ? recreateWarning(item, renameOnly) : undefined
        }
        error={mutation.error}
        form={form}
        readOnly={readOnly}
        saveLabel={item ? 'Save' : 'Create constraint'}
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
    cell: (item, { schema, search }) => (
      <span data-mask>
        <HighlightText text={item.columns.join(', ')} match={search} />
        {item.foreignTable && (
          <span className="text-muted-foreground">
            {' → '}
            <HighlightText text={referenceOf(item, schema)} match={search} />
          </span>
        )}
      </span>
    ),
    header: 'Columns',
  },
  labelColumn({
    align: 'end',
    header: 'Type',
    labelOf: (item: GroupedConstraint) => typeLabels[item.type],
    width: 'w-2/12',
  }),
]

export const Constraints = () => {
  const state = useDefinitionsState({
    section: 'constraints',
  })
  const { connectionResource, run, search, selectedSchema } = state
  const query = resourceConstraintsQueryOptions({ connectionResource })
  const { data: constraints = [], isPending } = useQuery(query)
  const kindFilter = useFilter<ConstraintKind>('All types', [
    { label: 'Primary keys', value: 'primaryKey' },
    { label: 'Foreign keys', value: 'foreignKey' },
    { label: 'Unique', value: 'unique' },
  ])

  const inSchema = groupConstraints(constraints, selectedSchema)

  return (
    <DefinitionsPage
      items={inSchema}
      match={(item) =>
        kindFilter.matches(item.type) &&
        matchesSearch(
          search,
          item.name,
          item.table,
          item.foreignTable,
          ...item.columns
        )
      }
      loading={isPending}
      keyOf={constraintKey}
      columns={columns}
      state={state}
      toolbar={kindFilter.control}
      queryKey={structureQueryKey(connectionResource)}
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
    />
  )
}
