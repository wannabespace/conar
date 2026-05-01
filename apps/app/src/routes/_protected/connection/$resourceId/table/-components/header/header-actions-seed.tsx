import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { Column } from '~/entities/connection/components'
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
import { Indicator } from '@conar/ui/components/custom/indicator'
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
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@conar/ui/components/popover'
import { Switch } from '@conar/ui/components/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import NumberFlow from '@number-flow/react'
import { RiCodeSSlashLine, RiSearchLine, RiSeedlingLine, RiVipCrownLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { Monaco } from '~/components/monaco'
import { distinctQuery, insertQuery, resourceRowsQueryInfiniteOptions, resourceTableTotalQueryOptions } from '~/entities/connection/queries'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { autoDetectGenerator, CUSTOM_GENERATOR, ENUM_GENERATOR, generateRows, getGeneratorGroups, getGenerators, REFERENCE_GENERATOR, SKIP_GENERATOR } from '~/entities/connection/utils/seeds'
import { FREE_SEED_LIMIT, incrementSeedUsage, seedUsageValue } from '~/entities/connection/utils/seeds/usage'
import { useSubscription as useUserSubscription } from '~/entities/user/hooks'
import { queryClient } from '~/main'
import { setIsSubscriptionDialogOpen } from '~/store'
import { Route } from '../..'
import { useTableColumns } from '../../-columns'
import { useTablePageStore } from '../../-store'
import { DefaultValueTooltipIcon, NullableTooltipIcon, PrimaryKeyTooltipIcon, ReadOnlyTooltipIcon, UniqueTooltipIcon } from '../table/table-header-cell'

function getAvailableGeneratorGroups(column: Column, dialect: ConnectionType) {
  return getGeneratorGroups(dialect)
    .map(group => ({
      ...group,
      items: group.items.filter((id) => {
        if (id === REFERENCE_GENERATOR)
          return !!column.foreign
        if (id === ENUM_GENERATOR)
          return !!column.enumName
        if (id === 'null')
          return !!column.isNullable
        return true
      }),
    }))
    .filter(group => group.items.length > 0)
}

function CustomExpressionPopover({
  columnId,
}: {
  columnId: string
}) {
  const store = useTablePageStore()
  const customExpression = useSubscription(store, { selector: state => state.generators[columnId]?.customExpression })

  const updateCustomExpression = (expression?: string) => {
    store.set(state => ({
      ...state,
      generators: {
        ...state.generators,
        [columnId]: {
          ...state.generators[columnId]!,
          customExpression: expression,
        },
      },
    } satisfies typeof state))
  }

  return (
    <Popover
      onOpenChangeComplete={(open) => {
        if (!open && !customExpression?.trim()) {
          updateCustomExpression()
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger
            render={(
              <Button
                variant="outline"
                size="icon-sm"
              />
            )}
          >
            {customExpression && <Indicator />}
            <RiCodeSSlashLine />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Edit SQL expression</TooltipContent>
      </Tooltip>
      <PopoverContent
        side="left"
        sideOffset={8}
        className="w-96 gap-0 p-0"
      >
        <PopoverTitle className="border-b p-2">
          Custom SQL Expression
        </PopoverTitle>
        <Monaco
          value={customExpression ?? 'SELECT 1'}
          language="sql"
          onChange={value => updateCustomExpression(value)}
          className="h-32"
          options={{
            lineNumbers: 'off',
            glyphMargin: false,
            folding: false,
            scrollBeyondLastLine: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            renderLineHighlight: 'none',
            scrollbar: { vertical: 'hidden', horizontal: 'auto' },
            padding: { top: 8, bottom: 8 },
          }}
        />
        <div className="border-t p-2 text-xs text-muted-foreground">
          Enter a raw SQL expression, for example:
          <br />
          {' '}
          <Badge variant="secondary" size="sm">NOW()</Badge>
          ,
          {' '}
          <Badge variant="secondary" size="sm">gen_random_uuid()</Badge>
          ,
          {' '}
          <Badge variant="secondary" size="sm">SELECT id FROM users LIMIT 1</Badge>
          or any other valid SQL expression.
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function HeaderActionsSeed({
  table,
  schema,
}: {
  table: string
  schema: string
}) {
  const columns = useTableColumns()
  const { connection, connectionResource } = Route.useRouteContext()
  const allGenerators = getGenerators(connection.type)
  const [open, setOpen] = useState(false)
  const store = useTablePageStore()
  const seedsCount = useSubscription(store, { selector: state => state.seedsCount })
  const generators = useSubscription(store, { selector: state => state.generators })
  const { filters, orderBy, exact } = useSubscription(store, { selector: state => pick(state, ['filters', 'orderBy', 'exact']) })

  const { subscription } = useUserSubscription()
  const seedUsageCount = useSubscription(seedUsageValue)
  const remainingFreeSeeds = Math.max(0, FREE_SEED_LIMIT - seedUsageCount)
  const hasReachedFreeLimit = !subscription && remainingFreeSeeds === 0

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
          && saved.generatorId in allGenerators
          && (saved.generatorId !== REFERENCE_GENERATOR || column.foreign)
          && (saved.generatorId !== ENUM_GENERATOR || column.enumName)
          && (saved.generatorId !== 'null' || column.isNullable)

        newGenerators[column.id] = isValid
          ? saved
          : {
              generatorId: autoDetectGenerator(column, connection.type),
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
          ...state.generators[columnId],
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

      const rows = generateRows({ columns, columnGenerators: generators, count: seedsCount, dialect: connection.type, referenceData })

      const BATCH_SIZE = 500
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        await insertQuery({ schema, table, rows: batch }).run(queryParams)
      }
    },
    onSuccess: () => {
      if (!subscription) {
        incrementSeedUsage()
      }
      toast.success(`Seeded ${seedsCount} row${seedsCount === 1 ? '' : 's'} into ${schema}.${table}`)
      queryClient.invalidateQueries(resourceRowsQueryInfiniteOptions({ connectionResource, table, schema, query: { filters, orderBy } }))
      queryClient.invalidateQueries(resourceTableTotalQueryOptions({ connectionResource, table, schema, query: { filters, exact } }))
      setOpen(false)
    },
    onError: (error) => {
      toast.error('Failed to seed data', { description: error.message })
    },
  })

  const activeCount = columns.filter(c => generators[c.id]?.generatorId && generators[c.id]?.generatorId !== SKIP_GENERATOR).length

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} position="right">
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger
            render={(
              <Button
                variant="secondary"
                size="icon"
                disabled={isPending}
              />
            )}
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
          {!subscription && (
            <div
              className="
                mb-4 flex items-center gap-2 rounded-md border bg-muted/50 px-3
                py-2 text-sm
              "
            >
              <RiVipCrownLine className="size-4 shrink-0 text-primary" />
              <span className="flex-1">
                {hasReachedFreeLimit
                  ? 'You have used all your free seed generations.'
                  : `${remainingFreeSeeds} of ${FREE_SEED_LIMIT} free seed generations remaining.`}
              </span>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsSubscriptionDialogOpen(true)}
              >
                Upgrade
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-4">
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
                        {column.typeLabel}
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
                    {column.foreign || (column.enumName && column.availableValues && column.availableValues.length > 0)
                      ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="w-56 justify-start"
                          >
                            {column.foreign
                              ? `${column.foreign.schema}.${column.foreign.table}`
                              : `Random enum value${column.isArray ? 's' : ''}`}
                          </Button>
                        )
                      : (
                          <div className="flex w-56 gap-1">
                            <Combobox
                              items={getAvailableGeneratorGroups(column, connection.type)}
                              itemToStringLabel={id => allGenerators[id]?.label ?? id}
                              autoHighlight
                              value={generators[column.id]?.generatorId ?? SKIP_GENERATOR}
                              onValueChange={(value) => {
                                if (value && value in allGenerators) {
                                  store.set(state => ({
                                    ...state,
                                    generators: {
                                      ...state.generators,
                                      [column.id]: {
                                        ...state.generators[column.id],
                                        generatorId: value,
                                        isNullable: state.generators[column.id]?.isNullable ?? false,
                                        customExpression: value === CUSTOM_GENERATOR
                                          ? state.generators[column.id]?.customExpression
                                          : undefined,
                                      },
                                    },
                                  } satisfies typeof state))
                                }
                              }}
                            >
                              <ComboboxTrigger
                                className="flex-1 justify-start"
                                render={<Button variant="outline" size="sm" />}
                              >
                                {allGenerators[generators[column.id]?.generatorId ?? SKIP_GENERATOR]?.label ?? 'Select a generator'}
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
                                            {allGenerators[id]?.label}
                                          </ComboboxItem>
                                        )}
                                      </ComboboxCollection>
                                    </ComboboxGroup>
                                  )}
                                </ComboboxList>
                              </ComboboxPopup>
                            </Combobox>
                            {generators[column.id]?.generatorId === CUSTOM_GENERATOR && (
                              <CustomExpressionPopover columnId={column.id} />
                            )}
                          </div>
                        )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DrawerPanel>
        <DrawerFooter>
          <NumberField
            min={1}
            max={10000}
            value={seedsCount}
            onValueChange={value => store.set(state => ({
              ...state,
              seedsCount: Math.max(1, Math.min(10000, value ?? 1)),
            } satisfies typeof state))}
            className="mr-auto w-32"
          >
            <NumberFieldGroup>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldGroup>
          </NumberField>
          <DrawerClose render={<Button variant="outline" />}>
            Cancel
          </DrawerClose>
          <Button
            onClick={() => {
              if (hasReachedFreeLimit) {
                setIsSubscriptionDialogOpen(true)
                return
              }
              seed()
            }}
            disabled={isPending || activeCount === 0}
          >
            <LoadingContent loading={isPending}>
              {hasReachedFreeLimit
                ? (
                    <>
                      <RiVipCrownLine className="size-4" />
                      Upgrade to Seed
                    </>
                  )
                : (
                    <>
                      <RiSeedlingLine className="size-4" />
                      <NumberFlow
                        value={seedsCount}
                        className="tabular-nums"
                        prefix="Seed "
                        suffix={seedsCount === 1 ? ' row' : ' rows'}
                      />
                    </>
                  )}
            </LoadingContent>
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
