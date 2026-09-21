import { LeftToRightListDashIcon, TagsIcon } from '@hugeicons/core-free-icons'
import { matchesSearch, sameList } from '@tamery/shared/utils/helpers'
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

import { capabilitiesOf } from '~/entities/connection/capabilities'
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

import { SchemaField, TextField } from '../-components/fields'
import type {
  InspectorWarning,
  SectionInspectorProps,
} from '../-components/inspector'
import {
  InspectorFooter,
  InspectorHeader,
  InspectorSection,
  InspectorSections,
} from '../-components/inspector'
import { DefinitionsPage } from '../-components/page'
import { useDefinitionMutation } from '../-hooks/use-definition-mutation'
import type { RunQuery } from '../-hooks/use-definitions-state'
import { useDefinitionsState } from '../-hooks/use-definitions-state'
import type { DefinitionsColumn } from '../-lib/columns'
import { labelColumn, nameColumn, textColumn } from '../-lib/columns'

type EnumItem = typeof enumType.infer

interface EnumDraft {
  drafts: EditableListItem[]
  name: string
  schema: string
}

interface EnumPlan {
  additions: string[]
  kind: 'in-place' | 'recreate'
  renames: Record<string, string>
  values: string[]
}

const enumPlan = (
  item: EnumItem | null,
  drafts: EditableListItem[]
): EnumPlan => {
  const original = item?.values ?? []
  const rows = drafts
    .map((draft) => ({ index: Number(draft.id), value: draft.value.trim() }))
    .filter((row) => row.value)
  const kept = rows.filter((row) => row.index < original.length)
  const renames: Record<string, string> = {}

  for (const row of kept) {
    const before = original[row.index] ?? ''

    if (before !== row.value) {
      renames[before] = row.value
    }
  }

  // RENAME VALUE cannot land on a label that still exists, so a swap replaces.
  const swaps = Object.values(renames).some((value) => original.includes(value))
  const inPlace =
    !swaps &&
    kept.length === original.length &&
    original.every((_, index) => rows[index]?.index === index)

  return {
    additions: rows
      .filter((row) => !kept.includes(row))
      .map((row) => row.value),
    kind: inPlace ? 'in-place' : 'recreate',
    renames,
    values: rows.map((row) => row.value),
  }
}

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
      const values = drafts.map((draft) => draft.value.trim()).filter(Boolean)

      if (values.length === 0) {
        return ctx.reject({ message: 'Add at least one value.' })
      }

      return (
        new Set(values).size === values.length ||
        ctx.reject({ message: 'Every value has to be different.' })
      )
    }),
  name: arkType(/\S/u).configure({ message: 'Give the enum a name.' }),
  schema: 'string',
})

const refreshColumns = (connectionResource: ConnectionResource) =>
  queryClient.invalidateQueries({
    queryKey: resourceColumnsQueryKey({ connectionResource }),
  })

const saveEnum = async ({
  connectionResource,
  draft,
  item,
  run,
}: {
  connectionResource: ConnectionResource
  draft: EnumDraft
  item: EnumItem | null
  run: RunQuery
}) => {
  const plan = enumPlan(item, draft.drafts)
  const name = draft.name.trim()

  if (!item) {
    await run(
      createEnumQuery({ name, schema: draft.schema, values: plan.values })
    )
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
    const dependents = await queryClient.query(
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

const replaceWarning = (item: EnumItem): InspectorWarning => ({
  action: 'Replace enum',
  description: (
    <>
      Postgres can only append to an enum, so we recreate{' '}
      <span data-mask className="font-medium">
        {item.name}
      </span>{' '}
      and repoint its columns. A row holding a dropped value, or a view built on
      the type, rolls it back.
    </>
  ),
})

// MySQL matches old list against new by text, so a renamed or removed label
// fails the rewrite under strict SQL mode and is written back as an empty
// string otherwise.
const lostValuesWarning = (
  item: EnumItem,
  values: string[]
): InspectorWarning | undefined => {
  const lost = item.values.filter((value) => !values.includes(value))

  if (!item.metadata?.table || lost.length === 0) {
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
        holding{' '}
        <span data-mask className="font-medium">
          {lost.join(', ')}
        </span>{' '}
        lose it for good: strict mode fails the rewrite, anything else blanks
        the cell.
      </>
    ),
  }
}

const valuesNote = ({
  item,
  readOnly,
  recreating,
}: {
  item: EnumItem | null
  readOnly: boolean
  recreating: boolean
}) => {
  if (!item) {
    return null
  }
  if (readOnly) {
    return 'We cannot edit enums on this database yet.'
  }
  if (item.metadata?.table) {
    return 'Values live on the column, so saving rewrites the whole list.'
  }

  return recreating
    ? null
    : 'Renaming and appending values alter the type in place.'
}

const nameHint = (item: EnumItem | null) => {
  if (!item?.metadata?.table) {
    return 'Recommended to use lowercase and an underscore to separate words.'
  }

  return `Column-bound ${item.metadata.isSet ? 'sets' : 'enums'} are named after their column.`
}

const describe = (item: EnumItem | null, schema: string) => {
  if (!item) {
    return schema
  }

  return item.metadata?.table
    ? `${item.schema}.${item.metadata.table}.${item.metadata.column}`
    : item.schema
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
}: SectionInspectorProps<EnumItem>) => {
  const mutation = useDefinitionMutation({
    mutationFn: async (draft: EnumDraft) => {
      await saveEnum({ connectionResource, draft, item, run })
      await refreshColumns(connectionResource)
    },
    onSuccess: () => onOpenChange(false),
    queryKey,
    success: (draft) =>
      `Enum "${draft.name.trim()}" ${item ? 'saved' : 'created'}`,
  })
  const form = useAppForm({
    defaultValues: {
      drafts: (item?.values.length ? item.values : ['']).map(
        (value, index) => ({ id: String(index), value })
      ),
      name: item?.name ?? '',
      schema: item?.schema ?? selectedSchema ?? '',
    } satisfies EnumDraft,
    onSubmit: ({ value }) => {
      mutation.mutate(value)
    },
    validators: { onChange: enumSchema, onMount: enumSchema },
  })
  const draft = useStore(form.store, (state) => state.values)

  const columnBound = !!item?.metadata?.table
  const readOnly = item ? !can.edit : !can.create
  const { kind, values } = enumPlan(item, draft.drafts)
  const replacesType = !columnBound && kind === 'recreate'
  const changed =
    !item || draft.name.trim() !== item.name || !sameList(values, item.values)
  const note = valuesNote({ item, readOnly, recreating: replacesType })
  const warning =
    item &&
    (replacesType ? replaceWarning(item) : lostValuesWarning(item, values))

  return (
    <>
      <InspectorHeader
        description={describe(item, draft.schema)}
        item={item}
        noun="enum"
      />
      <InspectorSections>
        <InspectorSection
          title="General"
          description="An enum limits a column to a fixed list of values."
        >
          <form.AppField name="schema">
            {() => (
              <SchemaField disabled={readOnly || !!item} schemas={schemas} />
            )}
          </form.AppField>
          <form.AppField name="name">
            {() => (
              <TextField
                label="Name"
                autoFocus={!item}
                description={nameHint(item)}
                disabled={readOnly || columnBound}
              />
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
                  readOnly={readOnly}
                  onItemsChange={field.handleChange}
                />
                <AnimatePresence initial={false}>
                  {note && (
                    <MotionCollapse key={note}>
                      <FieldDescription>{note}</FieldDescription>
                    </MotionCollapse>
                  )}
                </AnimatePresence>
              </field.Field>
            )}
          </form.AppField>
        </InspectorSection>
      </InspectorSections>
      <InspectorFooter
        canSave={changed}
        warning={warning ?? undefined}
        error={mutation.error}
        form={form}
        readOnly={readOnly}
        saveLabel={item ? 'Save' : 'Create enum'}
        saving={mutation.isPending}
      />
    </>
  )
}

const enumNameColumn = nameColumn({
  icon: (item: EnumItem) =>
    item.metadata?.isSet ? LeftToRightListDashIcon : TagsIcon,
  width: 'w-3/12',
})

const valuesColumn: DefinitionsColumn<EnumItem> = {
  cell: (item, { search }) => (
    <span data-mask className="flex flex-wrap gap-1">
      {item.values.map((value) => (
        <Badge key={value} variant="outline">
          <HighlightText text={value} match={search} />
        </Badge>
      ))}
    </span>
  ),
  header: 'Values',
}

const columnBoundColumns: DefinitionsColumn<EnumItem>[] = [
  enumNameColumn,
  textColumn({
    header: 'Table',
    valueOf: (item: EnumItem) => item.metadata?.table,
    width: 'w-2/12',
  }),
  textColumn({
    header: 'Column',
    valueOf: (item: EnumItem) => item.metadata?.column,
    width: 'w-2/12',
  }),
  valuesColumn,
  labelColumn({
    align: 'end',
    header: 'Type',
    labelOf: (item: EnumItem) => (item.metadata?.isSet ? 'Set' : 'Enum'),
    width: 'w-2/12',
  }),
]

const typeColumns: DefinitionsColumn<EnumItem>[] = [
  enumNameColumn,
  valuesColumn,
]

export const Enums = () => {
  const state = useDefinitionsState({ section: 'enums' })
  const { connectionResource, run, search, selectedSchema } = state
  const query = resourceEnumsQueryOptions({ connectionResource })
  const { data: enums = [], isPending } = useQuery(query)

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
      title={capabilitiesOf(state.type).enumsLabel}
      noun="enum"
      icon={TagsIcon}
      items={rows}
      inSchema={inSchema.length}
      loading={isPending}
      keyOf={(item) =>
        `${item.schema}.${item.name}.${item.metadata?.table ?? ''}.${item.metadata?.column ?? ''}`
      }
      columns={
        enums.some((item) => item.metadata?.table)
          ? columnBoundColumns
          : typeColumns
      }
      state={state}
      canCascade
      queryKey={query.queryKey}
      dropItem={async (item, cascade) => {
        await run(
          dropEnumQuery({ cascade, name: item.name, schema: item.schema })
        )
        await refreshColumns(connectionResource)
      }}
      Inspector={EnumInspector}
    />
  )
}
