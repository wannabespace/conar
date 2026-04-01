import type { useTableColumns } from '../../-queries/use-columns-query'
import type { GeneratorGroup, GeneratorId } from '~/entities/connection/utils/seeds'
import { pick } from '@conar/shared/utils/helpers'
import { Badge } from '@conar/ui/components/badge'
import { Button } from '@conar/ui/components/button'
import {
  Combobox,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
} from '@conar/ui/components/combobox'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from '@conar/ui/components/drawer'
import { Label } from '@conar/ui/components/label'
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@conar/ui/components/number-field'
import { Switch } from '@conar/ui/components/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import NumberFlow from '@number-flow/react'
import { RiSearchLine, RiSeedlingLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { distinctQuery, insertQuery, resourceRowsQueryInfiniteOptions, resourceTableTotalQueryOptions } from '~/entities/connection/queries'
import { findEnum, resourceEnumsQueryOptions } from '~/entities/connection/queries/enums'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { autoDetectGenerator, ENUM_GENERATOR, generateRows, GENERATOR_GROUPS, GENERATORS, REFERENCE_GENERATOR, SKIP_GENERATOR } from '~/entities/connection/utils/seeds'
import { queryClient } from '~/main'
import { Route } from '../..'
import { useTablePageStore } from '../../-store'
import { DefaultValueTooltipIcon, NullableTooltipIcon, PrimaryKeyTooltipIcon, ReadOnlyTooltipIcon, UniqueTooltipIcon } from '../table/table-header-cell'

type Column = NonNullable<ReturnType<typeof useTableColumns>>[number]

function getAvailableGeneratorGroups(column: Column) {
  return GENERATOR_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter((id) => {
        if (id === REFERENCE_GENERATOR)
          return !!column.foreign
        if (id === ENUM_GENERATOR)
          return !!column.enum
        if (id === SKIP_GENERATOR)
          return !!column.defaultValue
        if (id === 'null')
          return !!column.isNullable
        return true
      }),
    }))
    .filter(group => group.items.length > 0)
}

export function HeaderActionsSeed({
  table,
  schema,
  columns,
}: {
  table: string
  schema: string
  columns: Column[]
}) {
  const { connectionResource } = Route.useRouteContext()
  const [open, setOpen] = useState(false)
  const [rowCount, setRowCount] = useState(10)
  const store = useTablePageStore()
  const generators = useSubscription(store, { selector: state => state.generators })
  const { filters, orderBy, exact } = useSubscription(store, { selector: state => pick(state, ['filters', 'orderBy', 'exact']) })

  const handleOpenChange = (open: boolean) => {
    setOpen(open)

    if (!open) {
      return
    }

    store.set((state) => {
      const newGenerators: typeof state.generators = {}

      for (const column of columns) {
        const saved = state.generators[column.id]
        const isValid = saved
          && saved.generatorId in GENERATORS
          && (saved.generatorId !== SKIP_GENERATOR || column.defaultValue)
          && (saved.generatorId !== REFERENCE_GENERATOR || column.foreign)
          && (saved.generatorId !== ENUM_GENERATOR || column.enum)
          && (saved.generatorId !== 'null' || column.isNullable)

        newGenerators[column.id] = isValid
          ? saved
          : {
              generatorId: autoDetectGenerator(column),
              isNullable: false,
            }
      }

      return {
        ...state,
        generators: newGenerators,
      } satisfies typeof state
    })
  }

  const toggleNullableGeneration = (columnId: string) => {
    store.set(state => ({
      ...state,
      generators: {
        ...state.generators,
        [columnId]: {
          generatorId: state.generators[columnId]?.generatorId ?? SKIP_GENERATOR,
          isNullable: !state.generators[columnId]?.isNullable,
        },
      },
    } satisfies typeof state))
  }

  const { mutate: seed, isPending } = useMutation({
    mutationFn: async () => {
      const queryParams = connectionResourceToQueryParams(connectionResource)

      const referenceData = Object.fromEntries(
        await Promise.all(columns
          .filter(c => c.foreign)
          .map(async (column) => {
            const fk = column.foreign!
            const rows = await distinctQuery({
              schema: fk.schema,
              table: fk.table,
              column: fk.column,
            }).run(queryParams)
            return [column.id, rows.map(r => r[fk.column])]
          })),
      )

      const enums = await queryClient.ensureQueryData(resourceEnumsQueryOptions({ connectionResource }))

      const enumData = enums
        ? Object.fromEntries(
            columns
              .filter(c => c.enum)
              .map(column => [column.id, findEnum(enums, column, table)?.values ?? []] as const)
              .filter(([, values]) => values.length > 0),
          )
        : {}

      const rows = generateRows(columns, generators, rowCount, referenceData, enumData)

      const BATCH_SIZE = 500
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        await insertQuery({ schema, table, rows: batch }).run(queryParams)
      }
    },
    onSuccess: () => {
      toast.success(`Seeded ${rowCount} rows into ${schema}.${table}`)
      queryClient.invalidateQueries(resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query: { filters, orderBy } }))
      queryClient.invalidateQueries(resourceTableTotalQueryOptions({ connectionResource, table, schema, query: { filters, exact } }))
      setOpen(false)
    },
    onError: (error) => {
      toast.error('Failed to seed data', { description: error.message })
    },
  })

  const activeCount = columns
    ? columns.filter(c => generators[c.id]?.generatorId && generators[c.id]?.generatorId !== SKIP_GENERATOR).length
    : 0

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} position="right">
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger
            render={<Button variant="secondary" size="icon" />}
          >
            <RiSeedlingLine />
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>Seed data</TooltipContent>
      </Tooltip>
      <DrawerPopup
        showCloseButton
        variant="inset"
        position="right"
        className="max-w-xl"
      >
        <DrawerHeader>
          <DrawerTitle>Seed Data</DrawerTitle>
          <DrawerDescription>
            Generate fake data for
            {' '}
            {schema}
            .
            {table}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Number of rows</Label>
              <NumberField
                min={1}
                max={10000}
                value={rowCount}
                onValueChange={value => setRowCount(Math.max(1, Math.min(10000, value ?? 1)))}
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="mb-1">Columns</Label>
              {columns?.map(column => (
                <div
                  key={column.id}
                  className="
                    flex items-center gap-2 rounded-xl border bg-muted/30 px-3
                    py-2
                  "
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{column.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {column.primaryKey && <PrimaryKeyTooltipIcon primaryKey={column.primaryKey} />}
                      {column.isNullable && <NullableTooltipIcon />}
                      {column.unique && <UniqueTooltipIcon unique={column.unique} />}
                      {column.isEditable === false && <ReadOnlyTooltipIcon />}
                      {column.defaultValue && <DefaultValueTooltipIcon defaultValue={column.defaultValue} />}
                      <Badge
                        variant="secondary"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        {column.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {column.isNullable && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch
                            checked={generators[column.id]?.isNullable ?? false}
                            onCheckedChange={() => toggleNullableGeneration(column.id)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>Allow random NULL values</TooltipContent>
                      </Tooltip>
                    )}
                    {column.foreign || column.enum
                      ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-56 justify-start"
                          >
                            {column.foreign
                              ? `${column.foreign.schema}.${column.foreign.table}`
                              : 'Random enum value'}
                          </Button>
                        )
                      : (
                          <Combobox
                            items={getAvailableGeneratorGroups(column)}
                            itemToStringLabel={id => GENERATORS[id as GeneratorId]?.label ?? String(id)}
                            autoHighlight
                            value={generators[column.id]?.generatorId ?? SKIP_GENERATOR}
                            onValueChange={(value) => {
                              if (value && value in GENERATORS) {
                                store.set(state => ({
                                  ...state,
                                  generators: {
                                    ...state.generators,
                                    [column.id]: {
                                      generatorId: value as GeneratorId,
                                      isNullable: state.generators[column.id]?.isNullable ?? false,
                                    },
                                  },
                                } satisfies typeof state))
                              }
                            }}
                          >
                            <ComboboxTrigger
                              className="w-56 justify-start"
                              render={<Button variant="outline" size="sm" />}
                            >
                              {GENERATORS[generators[column.id]?.generatorId ?? SKIP_GENERATOR]?.label ?? 'Select a generator'}
                            </ComboboxTrigger>
                            <ComboboxPopup className="min-w-48">
                              <div className="border-b p-2">
                                <ComboboxInput
                                  placeholder="Search generators..."
                                  showTrigger={false}
                                  startAddon={<RiSearchLine />}
                                />
                              </div>
                              <ComboboxEmpty>No generators found.</ComboboxEmpty>
                              <ComboboxList>
                                {(group: GeneratorGroup) => (
                                  <ComboboxGroup key={group.value} items={group.items}>
                                    <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
                                    <ComboboxCollection>
                                      {(id: GeneratorId) => (
                                        <ComboboxItem key={id} value={id}>
                                          {GENERATORS[id]?.label}
                                        </ComboboxItem>
                                      )}
                                    </ComboboxCollection>
                                  </ComboboxGroup>
                                )}
                              </ComboboxList>
                            </ComboboxPopup>
                          </Combobox>
                        )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerPanel>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>
            Cancel
          </DrawerClose>
          <Button
            onClick={() => seed()}
            disabled={isPending || activeCount === 0}
          >
            <LoadingContent loading={isPending}>
              <RiSeedlingLine className="size-4" />
              <NumberFlow
                value={rowCount}
                className="tabular-nums"
                prefix="Seed "
                suffix={rowCount === 1 ? ' row' : ' rows'}
              />
            </LoadingContent>
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
