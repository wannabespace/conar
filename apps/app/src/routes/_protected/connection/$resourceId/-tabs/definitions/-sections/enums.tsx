import { LeftToRightListDashIcon, TagsIcon } from '@hugeicons/core-free-icons'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Badge } from '@tamery/ui/components/badge'
import { MotionCollapse } from '@tamery/ui/components/collapse.motion'
import type { EditableListItem } from '@tamery/ui/components/custom/editable-list'
import { EditableList } from '@tamery/ui/components/custom/editable-list'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { FieldDescription } from '@tamery/ui/components/field'
import {
  fieldErrorMessage,
  useAppForm,
} from '@tamery/ui/components/tanstack-form'
import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { type as arkType } from 'arktype'
import { AnimatePresence } from 'motion/react'

import type { SectionCapabilities } from '~/entities/connection/capabilities'
import type { ConnectionResource } from '~/entities/connection/core/sync'
import { alterEnumQuery } from '~/entities/connection/queries/enums/alter'
import { createEnumQuery } from '~/entities/connection/queries/enums/create'
import { enumDependentsQueryOptions } from '~/entities/connection/queries/enums/dependents'
import { dropEnumQuery } from '~/entities/connection/queries/enums/drop'
import type { enumType } from '~/entities/connection/queries/enums/list'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums/list'
import { recreateEnumQuery } from '~/entities/connection/queries/enums/recreate'
import { setColumnEnumValuesQuery } from '~/entities/connection/queries/enums/set-column-values'
import { resourceColumnsQueryKey } from '~/entities/connection/queries/tables/columns'
import { queryClient } from '~/lib/query-client'

import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorHeader,
  InspectorFooter,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { SchemaField } from '../-components/schema-select'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { Muted, monoColumn, nameColumn } from '../-lib/columns'
import { sameList } from '../-lib/lists'
import { matchesSearch } from '../-lib/search'

type EnumItem = typeof enumType.infer

const enumKey = (item: EnumItem) =>
  `${item.schema}.${item.name}.${item.metadata?.table ?? ''}.${item.metadata?.column ?? ''}`

// PostgreSQL alters a real enum type, MySQL rewrites the ENUM list stored on a
// column; anything else is read-only.
const enumEditable = (item: EnumItem, type: ConnectionType) =>
  item.metadata?.table
    ? type === ConnectionType.MySQL
    : type === ConnectionType.Postgres

const enumNote = ({
  item,
  recreating,
  type,
}: {
  item: EnumItem | null
  recreating: boolean
  type: ConnectionType
}) => {
  if (!item) {
    return null
  }
  if (!enumEditable(item, type)) {
    return 'Tamery cannot edit enums on this database yet.'
  }
  if (item.metadata?.table) {
    return 'Values live on the column, so saving rewrites the whole list.'
  }
  return recreating
    ? null
    : 'Renaming and appending values alter the type in place.'
}

interface EnumPlan {
  additions: string[]
  kind: 'in-place' | 'recreate'
  renames: Record<string, string>
  values: string[]
}

// A row keeps the index of the value it started as for its id, so a removal, a
// reorder and a rename stay tellable apart. A row the list adds carries a uuid,
// which reads back as NaN and counts as an addition.
const enumPlan = (
  item: EnumItem | null,
  drafts: EditableListItem[]
): EnumPlan => {
  const original = item?.values ?? []
  const renames: Record<string, string> = {}
  const survivors: number[] = []
  const additions: string[] = []
  const values: string[] = []

  for (const draft of drafts) {
    const value = draft.value.trim()

    if (!value) {
      continue
    }
    values.push(value)

    const originalIndex = Number(draft.id)

    if (originalIndex < original.length) {
      survivors.push(originalIndex)
      const before = original[originalIndex]

      if (before && before !== value) {
        renames[before] = value
      }
    } else {
      additions.push(value)
    }
  }

  // RENAME VALUE cannot land on a label that still exists, so a swap replaces.
  const swaps = Object.values(renames).some((value) => original.includes(value))
  const inPlace =
    !swaps &&
    survivors.length === original.length &&
    survivors.every((id, index) => id === index) &&
    values.slice(survivors.length).join('\n') === additions.join('\n')

  return { additions, kind: inPlace ? 'in-place' : 'recreate', renames, values }
}

const enumDescription = (item: EnumItem | null, schema: string) => {
  if (!item) {
    return schema
  }
  if (item.metadata?.table) {
    return `${item.schema}.${item.metadata.table}.${item.metadata.column}`
  }
  return item.schema
}

const draftsOf = (item: EnumItem | null) =>
  (item?.values.length ? item.values : ['']).map((value, index) => ({
    id: String(index),
    value,
  }))

const valuesOf = (drafts: EditableListItem[]) =>
  drafts.map((draft) => draft.value.trim()).filter(Boolean)

// MODIFY COLUMN restates the default, which has to name a surviving label.
const migratedDefault = (
  value: string | null,
  plan: EnumPlan,
  isSet: boolean
) => {
  if (value === null) {
    return null
  }
  const kept = (isSet ? value.split(',') : [value])
    .map((label) => plan.renames[label] ?? label)
    .filter((label) => plan.values.includes(label))

  return kept.length === 0 ? null : kept.join(',')
}

const enumSchema = arkType({
  drafts: arkType({ id: 'string', value: 'string' })
    .array()
    .narrow((drafts, ctx) => {
      const values = valuesOf(drafts)

      if (values.length === 0) {
        return ctx.reject({ message: 'Add at least one value.' })
      }

      return (
        new Set(values).size === values.length ||
        ctx.reject({ message: 'Every value has to be different.' })
      )
    }),
  name: arkType('string').narrow(
    (name, ctx) =>
      name.trim() !== '' || ctx.reject({ message: 'Give the enum a name.' })
  ),
  schema: 'string',
})

// Columns carry the type name, its labels and their defaults, so every write
// to an enum changes what they show.
const refreshColumns = (connectionResource: ConnectionResource) =>
  queryClient.invalidateQueries({
    queryKey: resourceColumnsQueryKey({ connectionResource }),
  })

const saveEnum = async ({
  connectionResource,
  drafts,
  item,
  name,
  run,
  schema,
}: {
  connectionResource: ConnectionResource
  drafts: EditableListItem[]
  item: EnumItem | null
  name: string
  run: RunQuery
  schema: string
}) => {
  const plan = enumPlan(item, drafts)

  if (!item) {
    await run(createEnumQuery({ name, schema, values: plan.values }))
    return
  }
  const { metadata } = item

  if (metadata?.table && metadata.column) {
    await run(
      setColumnEnumValuesQuery({
        charset: metadata.charset ?? null,
        collation: metadata.collation ?? null,
        column: metadata.column,
        comment: metadata.comment,
        defaultValue: migratedDefault(
          metadata.default ?? null,
          plan,
          !!metadata.isSet
        ),
        isSet: !!metadata.isSet,
        nullable: !!metadata.nullable,
        schema: item.schema,
        table: metadata.table,
        values: plan.values,
      })
    )
    return
  }

  if (plan.kind === 'recreate') {
    const dependents = await queryClient.fetchQuery(
      enumDependentsQueryOptions({
        connectionResource,
        name: item.name,
        schema: item.schema,
      })
    )

    await run(
      recreateEnumQuery({
        dependents,
        name: item.name,
        newName: name,
        renames: plan.renames,
        schema: item.schema,
        values: plan.values,
      })
    )
    return
  }

  await run(
    alterEnumQuery({
      additions: plan.additions,
      name: item.name,
      newName: name,
      renames: plan.renames,
      schema: item.schema,
    })
  )
}

const replaceWarning = (item: EnumItem | null): InspectorWarning => ({
  action: 'Replace enum',
  description: (
    <>
      PostgreSQL cannot remove or reorder the values of a live enum, so{' '}
      <span data-mask className="font-medium">
        {item?.name}
      </span>{' '}
      is dropped and created again, and every column that uses it is moved onto
      the new type. A row still holding a removed value, or a view or function
      built on the type, fails the move and nothing is changed.
    </>
  ),
})

// MySQL matches old list against new by text, so a renamed or removed label
// fails the rewrite under strict SQL mode and is written back as an empty
// string otherwise.
const lostValuesWarning = (
  item: EnumItem | null,
  values: string[]
): InspectorWarning | undefined => {
  const lost = (item?.values ?? []).filter((value) => !values.includes(value))

  if (!item?.metadata?.table || lost.length === 0) {
    return undefined
  }

  return {
    action: 'Rewrite column',
    description: (
      <>
        Rows of{' '}
        <span data-mask className="font-medium">
          {item.metadata.table}.{item.metadata.column}
        </span>{' '}
        still holding{' '}
        <span data-mask className="font-medium">
          {lost.join(', ')}
        </span>{' '}
        fail the rewrite under strict SQL mode, and are written back as an empty
        string otherwise. Nothing restores the old value.
      </>
    ),
  }
}

interface EnumDraft {
  drafts: EditableListItem[]
  name: string
  schema: string
}

const enumState = ({
  can,
  draft,
  item,
  type,
}: {
  can: SectionCapabilities
  draft: EnumDraft
  item: EnumItem | null
  type: ConnectionType
}) => {
  const columnBound = !!item?.metadata?.table
  const original = item?.values ?? []
  const values = valuesOf(draft.drafts)
  const plan = enumPlan(item, draft.drafts)
  const replacesType = !columnBound && plan.kind === 'recreate'

  return {
    canRemoveValues: columnBound || type === ConnectionType.Postgres,
    changed: item
      ? draft.name.trim() !== item.name || !sameList(values, original)
      : true,
    columnBound,
    note: enumNote({ item, recreating: replacesType, type }),
    original,
    readOnly: item ? !can.edit || !enumEditable(item, type) : !can.create,
    replacesType,
    values,
  }
}

const nameHint = (item: EnumItem | null) => {
  if (!item?.metadata?.table) {
    return 'Recommended to use lowercase and an underscore to separate words.'
  }
  return `Column-bound ${item.metadata.isSet ? 'sets' : 'enums'} are named after their column.`
}

const EnumInspector = ({
  can,
  connectionResource,
  item,
  onOpenChange,
  queryKey,
  run,
  schemas,
  selectedSchema,
  type,
}: SectionInspectorProps<EnumItem>) => {
  const mutation = useDefinitionMutation({
    mutationFn: async (draft: EnumDraft) => {
      await saveEnum({
        connectionResource,
        drafts: draft.drafts,
        item,
        name: draft.name.trim(),
        run,
        schema: draft.schema,
      })
      await refreshColumns(connectionResource)
    },
    onSuccess: () => onOpenChange(false),
    queryKey,
    success: (draft) =>
      `Enum "${draft.name.trim()}" ${item ? 'saved' : 'created'}`,
  })
  const form = useAppForm({
    defaultValues: {
      drafts: draftsOf(item),
      name: item?.name ?? '',
      schema: item?.schema ?? selectedSchema ?? '',
    } satisfies EnumDraft,
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: {
      onChange: enumSchema,
      onMount: enumSchema,
    },
  })
  const draft = useStore(form.store, (state) => state.values)
  const state = enumState({ can, draft, item, type })

  return (
    <>
      <InspectorHeader
        description={enumDescription(item, draft.schema)}
        title={item ? item.name : 'New enum'}
      />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="An enum limits a column to a fixed list of values."
        >
          <form.AppField name="schema">
            {(field) => (
              <SchemaField
                id={field.name}
                disabled={state.readOnly || !!item}
                schema={field.state.value}
                schemas={schemas}
                onSchemaChange={field.handleChange}
              />
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => (
              <field.Field>
                <field.Label>Name</field.Label>
                <field.Input
                  data-mask
                  autoFocus={!item}
                  disabled={state.readOnly || state.columnBound}
                  spellCheck={false}
                  autoComplete="off"
                />
                <FieldDescription>{nameHint(item)}</FieldDescription>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
        <InspectorSection
          title="Values"
          description="Every value a column of this type may hold, in order."
        >
          <form.AppField name="drafts">
            {(field) => (
              <field.Field>
                <EditableList
                  addLabel="Add value"
                  error={fieldErrorMessage(field)}
                  items={field.state.value}
                  placeholder="Value"
                  readOnly={state.readOnly}
                  canRemoveItem={(_, index) =>
                    state.canRemoveValues || index >= state.original.length
                  }
                  onItemsChange={field.handleChange}
                />
                <AnimatePresence initial={false}>
                  {state.note && (
                    <MotionCollapse gap={6} key={state.note}>
                      <FieldDescription>{state.note}</FieldDescription>
                    </MotionCollapse>
                  )}
                </AnimatePresence>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
      </InspectorSections>
      <InspectorFooter
        canSave={state.changed}
        warning={
          state.replacesType
            ? replaceWarning(item)
            : lostValuesWarning(item, state.values)
        }
        error={mutation.error}
        form={form}
        readOnly={state.readOnly}
        saveLabel={item ? 'Save' : 'Create enum'}
        saving={mutation.isPending}
      />
    </>
  )
}

const enumNameColumn = nameColumn({
  iconOf: (item: EnumItem) =>
    item.metadata?.isSet ? LeftToRightListDashIcon : TagsIcon,
  width: 'w-60',
})

const valuesColumn: DefinitionsColumn<EnumItem> = {
  cell: (item, { search }) => (
    <span data-mask className="flex flex-wrap gap-1">
      {item.values.map((value) => (
        <Badge key={value} variant="outline" mono>
          <HighlightText text={value} match={search} />
        </Badge>
      ))}
    </span>
  ),
  className: 'whitespace-normal',
  grow: true,
  header: 'Values',
}

const columnBoundColumns: DefinitionsColumn<EnumItem>[] = [
  enumNameColumn,
  monoColumn({
    header: 'Table',
    valueOf: (item: EnumItem) => item.metadata?.table,
    width: 'w-44',
  }),
  monoColumn({
    header: 'Column',
    valueOf: (item: EnumItem) => item.metadata?.column,
    width: 'w-44',
  }),
  valuesColumn,
  {
    align: 'end',
    cell: (item) => <Muted>{item.metadata?.isSet ? 'Set' : 'Enum'}</Muted>,
    header: 'Type',
    width: 'w-24',
  },
]

const typeColumns: DefinitionsColumn<EnumItem>[] = [
  enumNameColumn,
  valuesColumn,
]

export const Enums = () => {
  const state = useDefinitionsState({ section: 'enums' })
  const { run, search, selectedSchema } = state
  const query = resourceEnumsQueryOptions({
    connectionResource: state.connectionResource,
  })
  const { data: enums = [], isPending } = useQuery(query)
  const columnBound = enums.some((item) => item.metadata?.table)
  const withSets = state.type === ConnectionType.MySQL

  const inSchema = enums.filter((item) => item.schema === selectedSchema)
  const rows = inSchema.filter((item) =>
    matchesSearch(
      search,
      item.name,
      item.metadata?.table,
      item.metadata?.column,
      ...item.values
    )
  )

  return (
    <DefinitionsPage
      title={withSets ? 'Enums & Sets' : 'Enums'}
      noun="enum"
      icon={TagsIcon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={enumKey}
      columns={columnBound ? columnBoundColumns : typeColumns}
      state={state}
      canCascade
      queryKey={query.queryKey}
      dropItem={async (item, cascade) => {
        await run(
          dropEnumQuery({ cascade, name: item.name, schema: item.schema })
        )
        await refreshColumns(state.connectionResource)
      }}
      Inspector={EnumInspector}
      inspectorProps={state}
    />
  )
}
