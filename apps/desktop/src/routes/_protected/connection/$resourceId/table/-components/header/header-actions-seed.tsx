import type { useTableColumns } from '../../-queries/use-columns-query'
import type { GeneratorGroup, GeneratorId } from '~/entities/connection/utils/seeds'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import NumberFlow from '@number-flow/react'
import { RiSearchLine, RiSeedlingLine } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useSubscription } from 'seitu/react'
import { toast } from 'sonner'
import { seedQuery } from '~/entities/connection/queries/seed'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { autoDetectGenerator, generateRows, GENERATOR_GROUPS, GENERATORS, SKIP_GENERATOR } from '~/entities/connection/utils/seeds'
import { queryClient } from '~/main'
import { Route } from '../..'
import { useTablePageStore } from '../../-store'

type Column = NonNullable<ReturnType<typeof useTableColumns>>[number]

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

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      return
    }
    const existed = store.get().generators

    store.set(state => ({
      ...state,
      generators: Object.fromEntries(
        columns.map(column => [column.id, existed[column.id] ?? autoDetectGenerator(column)]),
      ),
    } satisfies typeof state))
  }

  const { mutate: seed, isPending } = useMutation({
    mutationFn: async () => {
      const rows = generateRows(columns, generators, rowCount)

      if (rows.length === 0)
        throw new Error('No rows to insert')

      const nonEmptyRows = rows.filter(row => Object.keys(row).length > 0)

      if (nonEmptyRows.length === 0)
        throw new Error('All columns are skipped')

      await seedQuery({ schema, table, rows: nonEmptyRows })
        .run(connectionResourceToQueryParams(connectionResource))
    },
    onSuccess: () => {
      toast.success(`Seeded ${rowCount} rows into ${schema}.${table}`)
      queryClient.invalidateQueries({ queryKey: ['connection-resource', connectionResource.id, 'schema', schema, 'table', table] })
      setOpen(false)
    },
    onError: (error) => {
      toast.error('Failed to seed data', { description: error.message })
    },
  })

  const activeCount = columns
    ? columns.filter(c => generators[c.id] && generators[c.id] !== SKIP_GENERATOR).length
    : 0

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} position="right">
      <Tooltip>
        <TooltipTrigger asChild>
          <DrawerTrigger
            render={<Button variant="secondary" size="icon" disabled={!columns} />}
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
        className="max-w-lg"
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
            <div className="flex flex-col gap-1">
              <Label className="mb-1">Columns</Label>
              {columns?.map(column => (
                <div
                  key={column.id}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{column.id}</span>
                      <span className="
                        shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[10px]
                        text-muted-foreground
                      "
                      >
                        {column.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {column.isArray && (
                        <Badge variant="info" size="sm" className="text-[10px]">
                          array
                        </Badge>
                      )}
                      {column.isNullable && (
                        <Badge
                          variant="warning"
                          size="sm"
                          className="text-[10px]"
                        >
                          nullable
                        </Badge>
                      )}
                      {column.primaryKey && (
                        <Badge
                          size="sm"
                          className="
                            bg-purple-500/10 text-[10px] text-purple-600
                            dark:text-purple-400
                          "
                        >
                          pk
                        </Badge>
                      )}
                      {column.defaultValue && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="
                            max-w-40 truncate text-[10px] text-muted-foreground
                          "
                          title={column.defaultValue}
                        >
                          has default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Combobox
                    items={GENERATOR_GROUPS}
                    autoHighlight
                    value={generators[column.id] ?? SKIP_GENERATOR}
                    onValueChange={(value) => {
                      if (value && value in GENERATORS) {
                        store.set(state => ({
                          ...state,
                          generators: { ...state.generators, [column.id]: value as GeneratorId },
                        } satisfies typeof state))
                      }
                    }}
                  >
                    <ComboboxTrigger
                      className="
                        w-56 shrink-0 justify-between text-xs font-normal
                      "
                      render={<Button variant="outline" size="sm" />}
                    >
                      {GENERATORS[generators[column.id] ?? SKIP_GENERATOR]?.label ?? 'Select a generator'}
                    </ComboboxTrigger>
                    <ComboboxPopup className="min-w-48">
                      <div className="border-b p-2">
                        <ComboboxInput
                          className="
                            rounded-md
                            before:rounded-[calc(var(--radius-md)-1px)]
                          "
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
