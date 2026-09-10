import {
  CrownIcon,
  Link01Icon,
  Refresh01Icon,
  SproutIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  Alert,
  AlertAction,
  AlertDescription,
} from '@tamery/ui/components/alert'
import { Button } from '@tamery/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@tamery/ui/components/command'
import { HighlightText } from '@tamery/ui/components/custom/highlight'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import { NumberFlow } from '@tamery/ui/components/custom/number-flow'
import { DrawerClose, DrawerFooter } from '@tamery/ui/components/drawer'
import { Input } from '@tamery/ui/components/input'
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@tamery/ui/components/number-field'
import { Switch } from '@tamery/ui/components/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useHotkey, useHotkeys } from '@tanstack/react-hotkeys'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { isOperationNodeSource } from 'kysely'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'

import { SidebarButton } from '~/components/sidebar-link'
import type { Column } from '~/entities/connection/components/table/cell/utils'
import { distinctQuery } from '~/entities/connection/queries/distinct'
import { insertQuery } from '~/entities/connection/queries/insert'
import { resourceRowsQueryKey } from '~/entities/connection/queries/rows'
import { resourceTableTotalQueryKey } from '~/entities/connection/queries/total'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime/query'
import { getValueForEditor } from '~/entities/connection/utils/helpers'
import type {
  GeneratorGroup,
  Generators,
} from '~/entities/connection/utils/seeds'
import {
  autoDetectGenerator,
  generateRows,
  getGeneratorGroups,
  getGenerators,
  insertBatchSize,
  isGeneratorAvailable,
} from '~/entities/connection/utils/seeds'
import type {
  Generator,
  GeneratorId,
} from '~/entities/connection/utils/seeds/registry'
import {
  CUSTOM_GENERATOR,
  NULL_GENERATOR,
  REFERENCE_GENERATOR,
  SKIP_GENERATOR,
} from '~/entities/connection/utils/seeds/types'
import {
  FREE_SEED_LIMIT,
  incrementSeedUsage,
  seedUsageValue,
} from '~/entities/connection/utils/seeds/usage'
import { useSubscription as useUserSubscription } from '~/entities/user/hooks/use-subscription'
import { queryClient } from '~/lib/query-client'
import { setIsSubscriptionDialogOpen } from '~/store'

import { useTableColumnsContext } from '../../../-lib/columns'
import { useTablePageStore } from '../../../-lib/store'
import {
  DefaultValueTooltipIcon,
  ForeignTooltipIcon,
  NullableTooltipIcon,
  PrimaryKeyTooltipIcon,
  ReadOnlyTooltipIcon,
  UniqueTooltipIcon,
} from '../../table/table-header-cell'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

const SEED_INSPECTOR_ID = 'seed-inspector'
const MAX_SEED_ROWS = 10_000
const PREVIEW_ROWS = 3

const generatorLabel = (
  generator: Generator,
  column: Column,
  generators: Generators
) => {
  if (generator.generatorId === REFERENCE_GENERATOR && column.foreign) {
    return column.foreign.table
  }
  if (generator.generatorId === SKIP_GENERATOR) {
    return 'Default'
  }
  return generators[generator.generatorId]?.label ?? generator.generatorId
}

const previewText = (value: unknown) => {
  if (value === null) {
    return 'NULL'
  }
  if (isOperationNodeSource(value)) {
    return 'SQL'
  }
  return getValueForEditor(value).replaceAll('\n', ' ')
}

const previewNote = (column: Column, generatorId: GeneratorId) => {
  if (generatorId === SKIP_GENERATOR) {
    return 'Left out of the insert. The database fills it in.'
  }
  if (generatorId === REFERENCE_GENERATOR && column.foreign) {
    return `A random ${column.foreign.column} from ${column.foreign.schema}.${column.foreign.table}`
  }
  if (generatorId === CUSTOM_GENERATOR) {
    return 'Inserted verbatim as SQL, once per row.'
  }
}

const Preview = ({
  column,
  generator,
  dialect,
}: {
  column: Column
  generator: Generator
  dialect: ConnectionType
}) => {
  const note = previewNote(column, generator.generatorId)
  const sample = () =>
    note
      ? []
      : generateRows({
          columnGenerators: { [column.id]: generator },
          columns: [column],
          count: PREVIEW_ROWS,
          dialect,
        }).map((row) => row[column.id])
  const [values, setValues] = useState(sample)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-6 shrink-0 items-center justify-between">
        <span className="text-muted-foreground text-2xs font-semibold tracking-wider uppercase">
          Preview
        </span>
        {!note && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setValues(sample)}
                />
              }
            >
              <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} />
            </TooltipTrigger>
            <TooltipContent>Regenerate</TooltipContent>
          </Tooltip>
        )}
      </div>
      {note ? (
        <p data-mask className="text-muted-foreground text-xs">
          {note}
        </p>
      ) : (
        <ul data-mask className="flex flex-col gap-1">
          {values.map((value, index) => (
            // oxlint-disable-next-line react/no-array-index-key
            <li key={index} className="truncate font-mono text-xs">
              {previewText(value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const GeneratorPicker = ({
  column,
  generator,
  generators,
  groups,
  dialect,
  inputRef,
  onChange,
  onLeave,
}: {
  column: Column
  generator: Generator
  generators: Generators
  groups: GeneratorGroup[]
  dialect: ConnectionType
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (id: GeneratorId) => void
  onLeave: () => void
}) => {
  const [search, setSearch] = useState('')
  const currentRef = useRef<HTMLDivElement>(null)
  const labelOf = (id: GeneratorId) => generators[id]?.label ?? id

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'start' })
  }, [])

  useHotkeys(
    [
      {
        callback: (event) => {
          event.preventDefault()
          event.stopPropagation()

          if (search) {
            setSearch('')
            return
          }

          onLeave()
        },
        hotkey: 'Escape',
      },
      {
        callback: (event) => {
          const input = inputRef.current
          const caretAtStart =
            input?.selectionStart === 0 && input?.selectionEnd === 0

          if (caretAtStart) {
            event.preventDefault()
            onLeave()
          }
        },
        hotkey: 'ArrowLeft',
      },
    ],
    { target: inputRef }
  )

  return (
    <Command
      defaultValue={generator.generatorId}
      filter={(_id, term, keywords) =>
        (keywords?.[0] ?? '').toLowerCase().includes(term.toLowerCase()) ? 1 : 0
      }
      variant="flat"
      className="min-h-0 flex-1"
    >
      <CommandInput
        ref={inputRef}
        variant="flat"
        placeholder="Search generators…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-none min-h-0 flex-1">
        <CommandEmpty>No generators found.</CommandEmpty>
        {groups.map((group) => {
          const items = group.items.filter((id) =>
            isGeneratorAvailable(id, column, dialect)
          )
          return (
            items.length > 0 && (
              <CommandGroup key={group.value} heading={group.value}>
                {items.map((id: GeneratorId) => (
                  <CommandItem
                    key={id}
                    ref={id === generator.generatorId ? currentRef : undefined}
                    value={id}
                    keywords={[labelOf(id)]}
                    data-checked={id === generator.generatorId}
                    onSelect={() => onChange(id)}
                  >
                    <HighlightText text={labelOf(id)} match={search} />
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          )
        })}
      </CommandList>
    </Command>
  )
}

const Inspector = ({
  column,
  generator,
  generators,
  groups,
  dialect,
  inputRef,
  onChange,
  onLeave,
}: {
  column: Column
  generator: Generator
  generators: Generators
  groups: GeneratorGroup[]
  dialect: ConnectionType
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (patch: Partial<Generator>) => void
  onLeave: () => void
}) => {
  const canRandomizeNulls =
    column.isNullable &&
    generator.generatorId !== NULL_GENERATOR &&
    generator.generatorId !== SKIP_GENERATOR

  return (
    <div
      id={SEED_INSPECTOR_ID}
      role="tabpanel"
      aria-labelledby={`seed-column-${column.id}`}
      className="flex min-w-0 flex-1 flex-col"
    >
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b px-3">
        <span data-mask className="truncate text-sm font-medium">
          {column.id}
        </span>
        {column.primaryKey && (
          <PrimaryKeyTooltipIcon primaryKey={column.primaryKey} />
        )}
        {column.foreign && (
          <ForeignTooltipIcon
            name={column.foreign.name}
            table={column.foreign.table}
            column={column.foreign.column}
          />
        )}
        {column.unique && <UniqueTooltipIcon unique={column.unique} />}
        {column.isNullable && <NullableTooltipIcon />}
        {column.defaultValue && (
          <DefaultValueTooltipIcon defaultValue={column.defaultValue} />
        )}
        {column.isGenerated && <ReadOnlyTooltipIcon />}
        <span
          data-mask
          className="text-muted-foreground ml-auto truncate font-mono text-xs"
        >
          {column.typeLabel}
        </span>
      </div>
      <GeneratorPicker
        column={column}
        generator={generator}
        generators={generators}
        groups={groups}
        dialect={dialect}
        inputRef={inputRef}
        onChange={(generatorId) => onChange({ generatorId })}
        onLeave={onLeave}
      />
      <div className="flex shrink-0 flex-col gap-3 border-t p-3">
        {generator.generatorId === CUSTOM_GENERATOR && (
          <Input
            data-mask
            aria-label="SQL expression"
            placeholder="now()"
            className="font-mono text-xs"
            value={generator.customExpression ?? ''}
            onChange={(event) =>
              onChange({ customExpression: event.target.value })
            }
          />
        )}
        {canRandomizeNulls && (
          <label
            htmlFor="seed-randomize-nulls"
            className="flex items-center justify-between gap-3 border-b pb-3 text-sm"
          >
            Randomize NULL values
            <Switch
              id="seed-randomize-nulls"
              size="sm"
              checked={generator.isNullable}
              onCheckedChange={(checked) => onChange({ isNullable: checked })}
            />
          </label>
        )}
        <Preview
          key={`${generator.generatorId}:${generator.isNullable}`}
          column={column}
          generator={generator}
          dialect={dialect}
        />
      </div>
    </div>
  )
}

export const SeedPanel = ({
  table,
  schema,
  onOpenChange,
}: {
  table: string
  schema: string
  onOpenChange: (open: boolean) => void
}) => {
  const { columns } = useTableColumnsContext()
  const { connection, connectionResource } = useRouteContext()
  const dialect = connection.type
  const generators = getGenerators(dialect)
  const groups = getGeneratorGroups(dialect)
  const store = useTablePageStore()
  const seedsCount = useSubscription(store, {
    selector: (state) => state.seedsCount,
  })
  const savedGenerators = useSubscription(store, {
    selector: (state) => state.generators,
  })
  const [selectedId, setSelectedId] = useState<string>()
  const selectedColumn =
    columns.find((column) => column.id === selectedId) ?? columns[0]
  const columnsRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    columnsRef.current?.focus()
  }, [])

  const { subscription } = useUserSubscription()
  const seedUsageCount = useSubscription(seedUsageValue)
  const remainingFreeSeeds = Math.max(0, FREE_SEED_LIMIT - seedUsageCount)
  const hasReachedFreeLimit = !subscription && remainingFreeSeeds === 0

  const columnGenerators = Object.fromEntries(
    columns.map((column): [string, Generator] => {
      const saved = savedGenerators[column.id]
      const isValid =
        saved &&
        saved.generatorId in generators &&
        isGeneratorAvailable(saved.generatorId, column, dialect)
      return [
        column.id,
        isValid
          ? saved
          : {
              generatorId: autoDetectGenerator(column, dialect),
              isNullable: true,
            },
      ]
    })
  )
  const selectedGenerator =
    selectedColumn && columnGenerators[selectedColumn.id]

  const updateGenerator = (columnId: string, generator: Generator) =>
    store.set(
      (state) =>
        ({
          ...state,
          generators: { ...state.generators, [columnId]: generator },
        }) satisfies typeof state
    )

  const selectAt = (index: number) => {
    const column = columns.at(Math.min(index, columns.length - 1))
    if (column) {
      setSelectedId(column.id)
    }
  }

  const selectedIndex = columns.findIndex(
    (column) => column.id === selectedColumn?.id
  )

  useHotkeys(
    [
      { callback: () => selectAt(selectedIndex + 1), hotkey: 'ArrowDown' },
      {
        callback: () => selectAt(Math.max(0, selectedIndex - 1)),
        hotkey: 'ArrowUp',
      },
      { callback: () => selectAt(0), hotkey: 'Home' },
      { callback: () => selectAt(columns.length - 1), hotkey: 'End' },
      { callback: () => searchRef.current?.focus(), hotkey: 'ArrowRight' },
      { callback: () => searchRef.current?.focus(), hotkey: 'Enter' },
    ],
    { preventDefault: true, target: columnsRef }
  )

  const activeGenerators = Object.values(columnGenerators).filter(
    (generator) => generator.generatorId !== SKIP_GENERATOR
  )
  const hasEmptyExpression = activeGenerators.some(
    (generator) =>
      generator.generatorId === CUSTOM_GENERATOR &&
      !generator.customExpression?.trim()
  )
  const canSeed =
    activeGenerators.length > 0 && !hasEmptyExpression && !hasReachedFreeLimit

  const { mutate: seed, isPending } = useMutation({
    mutationFn: async () => {
      const queryParams =
        await connectionResourceToQueryParams(connectionResource)

      const referenceData = Object.fromEntries(
        await Promise.all(
          columns.flatMap(({ foreign, id }) =>
            foreign && columnGenerators[id]?.generatorId === REFERENCE_GENERATOR
              ? [
                  distinctQuery({
                    column: foreign.column,
                    schema: foreign.schema,
                    table: foreign.table,
                  })
                    .run(queryParams)
                    .then(
                      (rows) =>
                        [id, rows.map((row) => row[foreign.column])] as const
                    ),
                ]
              : []
          )
        )
      )

      const rows = generateRows({
        columnGenerators,
        columns,
        count: seedsCount,
        dialect,
        referenceData,
      })

      await insertQuery({
        batchSize: insertBatchSize(dialect, activeGenerators.length),
        rows,
        schema,
        table,
      }).run(queryParams)
    },
    onSuccess: () => {
      if (!subscription) {
        incrementSeedUsage()
      }
      toast.success(
        `Seeded ${seedsCount} row${seedsCount === 1 ? '' : 's'} into ${schema}.${table}`
      )
      queryClient.invalidateQueries({
        queryKey: resourceRowsQueryKey({ connectionResource, schema, table }),
      })
      queryClient.invalidateQueries({
        queryKey: resourceTableTotalQueryKey({
          connectionResource,
          schema,
          table,
        }),
      })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Failed to seed data', { description: error.message })
    },
  })

  useHotkey('Mod+Enter', () => seed(), { enabled: canSeed && !isPending })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!subscription && (
        <div className="border-b p-3">
          <Alert size="sm">
            <HugeiconsIcon
              icon={CrownIcon}
              strokeWidth={2}
              className="text-primary"
            />
            <AlertDescription>
              {hasReachedFreeLimit
                ? 'You have used all your free seed runs.'
                : `${remainingFreeSeeds} of ${FREE_SEED_LIMIT} free seed runs left.`}
            </AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsSubscriptionDialogOpen(true)}
              >
                Upgrade
              </Button>
            </AlertAction>
          </Alert>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div
          ref={columnsRef}
          role="tablist"
          aria-orientation="vertical"
          tabIndex={-1}
          aria-label="Columns"
          aria-activedescendant={
            selectedColumn && `seed-column-${selectedColumn.id}`
          }
          className="no-scrollbar scroll-fade flex w-72 shrink-0 flex-col gap-px overflow-y-auto border-r p-2 outline-none"
        >
          {columns.map((column) => {
            const generator = columnGenerators[column.id]
            const active = column.id === selectedColumn?.id
            return (
              generator && (
                <SidebarButton
                  key={column.id}
                  id={`seed-column-${column.id}`}
                  role="tab"
                  tabIndex={-1}
                  aria-controls={SEED_INSPECTOR_ID}
                  aria-selected={active}
                  active={active}
                  onClick={() => setSelectedId(column.id)}
                >
                  <span data-mask className="min-w-0 flex-1 truncate text-left">
                    {column.id}
                  </span>
                  <span
                    data-mask
                    className={cn(
                      'flex max-w-28 shrink-0 items-center gap-1 text-xs',
                      active
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    )}
                  >
                    {generator.generatorId === REFERENCE_GENERATOR && (
                      <HugeiconsIcon
                        icon={Link01Icon}
                        strokeWidth={2}
                        // SidebarButton paints every icon primary at size-4; a
                        // row's trailing glyph follows the label instead
                        className="size-3! shrink-0 text-current!"
                      />
                    )}
                    <span className="truncate">
                      {generatorLabel(generator, column, generators)}
                    </span>
                  </span>
                </SidebarButton>
              )
            )
          })}
        </div>
        {selectedColumn && selectedGenerator && (
          <Inspector
            key={selectedColumn.id}
            inputRef={searchRef}
            onLeave={() => columnsRef.current?.focus()}
            column={selectedColumn}
            generator={selectedGenerator}
            generators={generators}
            groups={groups}
            dialect={dialect}
            onChange={(patch) =>
              updateGenerator(selectedColumn.id, {
                ...selectedGenerator,
                ...patch,
              })
            }
          />
        )}
      </div>
      <DrawerFooter>
        <NumberField
          min={1}
          max={MAX_SEED_ROWS}
          value={seedsCount}
          onValueChange={(value) =>
            store.set(
              (state) =>
                ({
                  ...state,
                  seedsCount: Math.max(1, Math.min(MAX_SEED_ROWS, value ?? 1)),
                }) satisfies typeof state
            )
          }
          className="mr-auto w-28"
        >
          <NumberFieldGroup>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
        <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        <Button
          onClick={() => {
            if (hasReachedFreeLimit) {
              setIsSubscriptionDialogOpen(true)
              return
            }
            seed()
          }}
          disabled={isPending || (!canSeed && !hasReachedFreeLimit)}
        >
          <LoadingContent loading={isPending}>
            <HugeiconsIcon
              icon={hasReachedFreeLimit ? CrownIcon : SproutIcon}
              strokeWidth={2}
            />
            {hasReachedFreeLimit ? (
              'Upgrade to seed'
            ) : (
              <NumberFlow
                value={seedsCount}
                className="tabular-nums"
                prefix="Seed "
                suffix={seedsCount === 1 ? ' row' : ' rows'}
              />
            )}
          </LoadingContent>
        </Button>
      </DrawerFooter>
    </div>
  )
}
