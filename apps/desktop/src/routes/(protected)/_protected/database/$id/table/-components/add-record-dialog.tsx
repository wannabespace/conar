import type { databases } from '~/drizzle'
import type { ExtendedColumn } from '~/entities/database/sql/record'
import type { Column } from '~/entities/database/utils/table'
import { Button } from '@conar/ui/components/button'
import { Calendar } from '@conar/ui/components/calendar'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@conar/ui/components/select'
import { Switch } from '@conar/ui/components/switch'
import { RiArrowDownSLine, RiInformationFill } from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { databaseRowsQuery } from '~/entities/database'
import { useDatabaseEnums } from '~/entities/database/queries/enums'
import { columnsQuery } from '~/entities/database/sql/columns'
import { buildInitialValues, buildInsertPayload, getPrimaryKeyColumns, insertRecordQuery } from '~/entities/database/sql/record'
import { queryClient } from '~/main'
import { Route } from '..'

interface AddRecordDialogProps {
  ref?: React.RefObject<{
    open: (database: typeof databases.$inferSelect, schema: string, table: string) => void
  } | null>
}

export function AddRecordDialog({ ref }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const { database } = Route.useRouteContext()
  const { data: enums } = useDatabaseEnums({ database })
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [columns, setColumns] = useState<ExtendedColumn[]>([])
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [calendarOpen, setCalendarOpen] = useState<Record<string, boolean>>({})

  const toggleCalendar = (fieldId: string, state?: boolean) => {
    setCalendarOpen(prev => ({
      ...prev,
      [fieldId]: state !== undefined ? state : !prev[fieldId],
    }))
  }

  useImperativeHandle(ref, () => ({
    open: async (dbOverride: typeof databases.$inferSelect, sch: string, tbl: string) => {
      if (!database)
        return
      const db = dbOverride ?? database
      setSchema(sch)
      setTable(tbl)
      setValues({})

      try {
        const primaryKeyColumns = await getPrimaryKeyColumns(db, sch, tbl)

        const tableColumns = await columnsQuery.run(db, { schema: sch, table: tbl })

        const columnsWithPrimary = tableColumns.map(col => ({
          ...col,
          defaultValue: col.default,
          isEditable: true,
          isPrimary: primaryKeyColumns.includes(col.id),
        }))

        setColumns(columnsWithPrimary)

        const initialValues = buildInitialValues(database, primaryKeyColumns, table, columnsWithPrimary)
        setValues(initialValues)
        setOpen(true)
      }
      catch (error) {
        console.error('Error fetching table columns:', error)
        toast.error(`Failed to fetch table columns ${error instanceof Error ? error.message : String(error)}`)
      }
    },
  }), [])

  const insertRecordMutation = useMutation({
    mutationFn: async ({
      columns,
      values,
      schema,
      table,
      database,
    }: {
      columns: string[]
      values: unknown[]
      schema: string
      table: string
      database: typeof databases.$inferSelect
    }) => {
      return insertRecordQuery.run(database, {
        schema,
        table,
        columns,
        values,
      })
    },
    onSuccess: () => {
      toast.success('Record added successfully')
      queryClient.invalidateQueries({
        queryKey: databaseRowsQuery({
          database,
          table,
          schema,
          query: { filters: [], orderBy: {} },
        }).queryKey.slice(0, -1),
      })
      setOpen(false)
    },
    onError: (error: unknown) => {
      console.error('Error inserting record:', error)
      toast.error(`Failed to insert record: ${error instanceof Error ? error.message : String(error)}`)
    },
  })

  const isSubmitting = insertRecordMutation.isPending

  const handleSubmit = async () => {
    if (!database || !table || !schema)
      return

    const payload = buildInsertPayload(database, columns, values)

    if (!payload) {
      toast.error('No valid columns to insert')
      return
    }

    try {
      await insertRecordMutation.mutateAsync({
        columns: payload.columns,
        values: payload.values,
        schema,
        table,
        database,
      })
    }
    catch (error) {
      console.error('Error inserting record:', error)
    }
  }

  const handleValueChange = (columnId: string, value: unknown) => {
    setValues(prev => ({
      ...prev,
      [columnId]: value,
    }))
  }

  const renderInputField = (column: Column) => {
    const value = values[column.id]

    const enumType = enums?.find(e => e.name === column.type || (column.type === 'enum' && e.name === column.id))

    if (enumType) {
      return (
        <Select
          value={String(value || '')}
          onValueChange={val => handleValueChange(column.id, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${column.id}`} />
          </SelectTrigger>
          <SelectContent>
            {enumType.values.map(val => (
              <SelectItem key={val} value={val}>
                {val}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (column.type === 'boolean') {
      const boolValue = value === true

      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={`field-${column.id}`}
            checked={boolValue === true}
            onCheckedChange={checked => handleValueChange(column.id, checked)}
          />
          <Label htmlFor={`field-${column.id}`}>
            {boolValue === true ? 'True' : 'False'}
          </Label>
        </div>
      )
    }

    if (column.type?.includes('time') || column.type?.includes('date')) {
      if (value === '(Auto-generated)') {
        return (
          <div className="flex items-center space-x-2 w-full">
            <Input
              id={`field-${column.id}`}
              value={String(value)}
              disabled
              className="bg-muted/30 text-muted-foreground italic border-dashed"
              placeholder={`Enter ${column.type}`}
            />
            <div className="text-xs text-muted-foreground">
              <RiInformationFill className="size-3 text-muted-foreground" />
              Auto
            </div>
          </div>
        )
      }

      const currentValue = value === null || value === ''
        ? new Date()
        : (value instanceof Date ? value : new Date(String(value)))

      const isDateTimeField = column.type?.includes('time')

      const formattedDateDisplay = currentValue
        ? dayjs(currentValue).format('YYYY-MM-DD')
        : 'Select date'

      const formattedTime = currentValue
        ? dayjs(currentValue).format('HH:mm:ss')
        : '00:00:00'

      const isCalendarOpen = calendarOpen[column.id] || false

      return (
        <div className="flex flex-col gap-2 w-full">
          {isDateTimeField
            ? (
                <div className="flex gap-2 w-full">
                  <div className="flex-1">
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={open => toggleCalendar(column.id, open)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                          type="button"
                        >
                          {formattedDateDisplay}
                          <RiArrowDownSLine className="ml-2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={currentValue}
                          captionLayout="dropdown"
                          onSelect={(date) => {
                            if (date) {
                              if (currentValue) {
                                date.setHours(currentValue.getHours(), currentValue.getMinutes(), currentValue.getSeconds())
                              }
                              handleValueChange(column.id, date)
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="w-1/2">
                    <Input
                      type="time"
                      step="1"
                      value={formattedTime}
                      onChange={(e) => {
                        const timeString = e.target.value
                        const [hours, minutes, seconds] = timeString.split(':').map(Number)

                        const updatedDate = new Date(currentValue || new Date())
                        updatedDate.setHours(hours || 0)
                        updatedDate.setMinutes(minutes || 0)
                        updatedDate.setSeconds(seconds || 0)

                        handleValueChange(column.id, updatedDate)
                      }}
                      className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </div>
                </div>
              )
            : (
                <Popover
                  open={isCalendarOpen}
                  onOpenChange={open => toggleCalendar(column.id, open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                      type="button"
                    >
                      {formattedDateDisplay}
                      <RiArrowDownSLine className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentValue}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (date) {
                          handleValueChange(column.id, date)
                          toggleCalendar(column.id, false)
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
        </div>
      )
    }

    if (value === '(Auto-generated)') {
      return (
        <div className="flex items-center space-x-2 w-full">
          <Input
            id={`field-${column.id}`}
            value={String(value)}
            disabled
            className="bg-muted/30 text-muted-foreground italic border-dashed"
            placeholder={`Enter ${column.type}`}
          />
          <div className="text-xs text-muted-foreground">
            <RiInformationFill className="size-3 text-muted-foreground" />
            Auto
          </div>
        </div>
      )
    }

    return (
      <Input
        id={`field-${column.id}`}
        value={value === null ? '' : String(value || '')}
        onChange={e => handleValueChange(column.id, e.target.value)}
        placeholder={`Enter ${column.type}`}
      />
    )
  }

  const handleSetNull = (columnId: string) => {
    handleValueChange(columnId, null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Record</DialogTitle>
          <DialogDescription>
            Fill in the fields to add a new record to the table.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {columns.map(column => (
            <div key={column.id} className="grid grid-cols-12 items-center gap-4">
              <Label
                htmlFor={`field-${column.id}`}
                className="text-right col-span-3 truncate pr-2 text-sm"
                title={column.id}
              >
                {column.id}
                {!column.isNullable && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              <div className="col-span-7">
                {renderInputField(column)}
              </div>
              <div className="col-span-2 flex justify-end">
                {column.isNullable && (
                  <Button
                    variant={values[column.id] === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSetNull(column.id)}
                  >
                    NULL
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
