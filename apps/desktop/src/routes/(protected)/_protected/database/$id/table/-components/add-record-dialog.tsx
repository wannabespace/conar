import type { databases } from '~/drizzle'
import type { Column } from '~/entities/database/utils/table'
import { TIMESTAMP_FIELDS } from '@conar/shared/constants'
import { Button } from '@conar/ui/components/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Switch } from '@conar/ui/components/switch'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { databaseRowsQuery } from '~/entities/database'
import { insertRecordQuery, primaryKeysQuery, tableColumnsQuery } from '~/entities/database/sql/record'
import { queryClient } from '~/main'

interface ExtendedColumn extends Column {
  defaultValue?: string | null
  isPrimary?: boolean
}

interface PrimaryKeyInfo {
  column_name: string
  column_default: string | null
  is_nullable: string
  data_type: string
}

interface AddRecordDialogProps {
  ref?: React.RefObject<{
    open: (database: typeof databases.$inferSelect, schema: string, table: string) => void
  } | null>
}

export function AddRecordDialog({ ref }: AddRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [database, setDatabase] = useState<typeof databases.$inferSelect | null>(null)
  const [schema, setSchema] = useState('')
  const [table, setTable] = useState('')
  const [columns, setColumns] = useState<ExtendedColumn[]>([])
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setPrimaryKeys = useState<PrimaryKeyInfo[]>([])[1]

  function prepareValue(value: unknown, type?: string): unknown {
    if (!type)
      return value

    return typeof value === 'string' && type.endsWith('[]') ? JSON.parse(value) : value
  }

  const getPrimaryKeyInfo = async (db: typeof databases.$inferSelect, schema: string, tableName: string): Promise<PrimaryKeyInfo[]> => {
    try {
      const pkInfo = await primaryKeysQuery.run(db, { schema, table: tableName })
      console.log('Primary key info from query:', pkInfo)

      if (pkInfo && pkInfo.length > 0) {
        const firstPk = pkInfo[0]

        // if we need to normalize the data structure
        if (firstPk && typeof firstPk === 'object') {
          // If it has 'id' property but not 'column_name', it's in normalized format
          if ('id' in firstPk && !('column_name' in firstPk)) {
            // Convert to our expected format
            return pkInfo.map((pk) => {
              // Safe type casting with runtime checks
              const id = 'id' in pk ? String(pk.id) : ''
              const defaultValue = 'defaultValue' in pk ? pk.defaultValue as string | null : null
              const isNullable = 'isNullable' in pk ? Boolean(pk.isNullable) : false
              const type = 'type' in pk ? String(pk.type) : ''

              return {
                column_name: id,
                column_default: defaultValue,
                is_nullable: isNullable ? 'YES' : 'NO',
                data_type: type,
              }
            })
          }
        }

        // If it's already in the right format, return it
        return pkInfo
      }

      console.log('No primary keys found with primaryKeysQuery')
      return []
    }
    catch (error) {
      console.error('Error getting primary keys:', error)
      return []
    }
  }

  useImperativeHandle(ref, () => ({
    open: async (db, sch, tbl) => {
      setDatabase(db)
      setSchema(sch)
      setTable(tbl)
      setValues({})

      try {
        const pkInfo = await getPrimaryKeyInfo(db, sch, tbl)
        setPrimaryKeys(pkInfo)

        const tableColumns = await tableColumnsQuery.run(db, { schema: sch, table: tbl })
        console.log('Table columns:', tableColumns)

        // Add isPrimary property to each column
        const columnsWithPrimary = tableColumns.map(col => ({
          ...col,
          defaultValue: col.default_value,
          isEditable: true,
          isPrimary: pkInfo.some(pk => pk.column_name === col.id),
        }))

        console.log('Columns with primary info:', columnsWithPrimary)

        setColumns(columnsWithPrimary)

        const initialValues: Record<string, unknown> = {}

        console.log('Primary key info before forEach:', JSON.stringify(pkInfo))

        columnsWithPrimary.forEach((col) => {
          let isPrimary = pkInfo.some((pk) => {
            console.log(`Comparing pk.column_name=${pk.column_name} with col.id=${col.id}`)
            return pk.column_name === col.id
          })

          if (pkInfo.length === 0) {
            if (col.id === 'id' || col.id === '_id'
              || (col.id.endsWith('_id') && col.id.startsWith(table.toLowerCase()))
              || (col.id.endsWith('Id') && col.id.startsWith(table.toLowerCase()))) {
              console.log(`Potential primary key detected: ${col.id}`)
              isPrimary = true
            }

            if ((col.type === 'uuid' || col.type === 'cuid'
              || col.type.includes('int') || col.type.includes('serial'))
            && (col.id === 'id' || col.id.endsWith('Id') || col.id.endsWith('_id'))) {
              console.log(`Type-based primary key detected: ${col.id} (${col.type})`)
              isPrimary = true
            }
          }

          // Check both defaultValue and default_value for auto-generated values
          const defaultVal = col.defaultValue || col.default_value
          const hasAutoDefault = defaultVal
            && (defaultVal?.includes('nextval') // PostgreSQL sequences
              || defaultVal?.includes('uuid_generate') // PostgreSQL UUID functions
              || defaultVal?.includes('gen_random_uuid') // Another PostgreSQL UUID function
              || defaultVal?.includes('auto_increment') // MySQL auto increment
              || defaultVal?.includes('GENERATED') // SQL standard for generated columns
              || defaultVal?.includes('IDENTITY')) // SQL Server identity columns

          console.log(`Column ${col.id}: isPrimary=${isPrimary}, type=${col.type}, defaultVal=${defaultVal}, hasAutoDefault=${hasAutoDefault}`)

          if (isPrimary && !hasAutoDefault) {
            if (col.type === 'uuid') {
              console.log(`Generating UUID for ${col.id}`)
              const newUuid = v7()
              console.log(`Generated UUID: ${newUuid}`)
              initialValues[col.id] = newUuid
            }
            else if (col.type === 'cuid' || col.type === 'cuid2') {
              console.log(`Generating UUID for CUID field ${col.id}`)
              initialValues[col.id] = v7()
            }
            else if (col.type.includes('char') || col.type.includes('text') || col.type.includes('varchar')) {
              console.log(`Generating string ID for ${col.id}`)
              initialValues[col.id] = v7()
            }

            else if (col.type.includes('int') || col.type.includes('serial') || col.type.includes('number')) {
              console.log(`Skipping auto-increment field ${col.id}`)
              initialValues[col.id] = '(Auto-generated)'
            }
            else {
              console.log(`Setting null for primary key ${col.id} of type ${col.type}`)
              initialValues[col.id] = null
            }
          }
          else if (!hasAutoDefault) {
            initialValues[col.id] = null
          }

          if (TIMESTAMP_FIELDS.includes(col.id as (typeof TIMESTAMP_FIELDS)[number])) {
            initialValues[col.id] = new Date()
          }
        })

        setValues(initialValues)
        setOpen(true)
      }
      catch (error) {
        console.error('Error fetching table columns:', error)
        toast.error('Failed to fetch table columns')
      }
    },
  }), [])

  const handleSubmit = async () => {
    if (!database || !table || !schema)
      return

    setIsSubmitting(true)

    try {
      TIMESTAMP_FIELDS.forEach((field) => {
        if (columns.some(col => col.id === field) && values[field] === undefined) {
          values[field] = new Date()
        }
      })

      columns.forEach((col) => {
        if (col.type === 'boolean' && (values[col.id] === undefined || values[col.id] === null)) {
          // For required boolean fields, default to false rather than null
          values[col.id] = !col.isNullable ? false : null
        }
      })

      // Ensure we include all required fields and fields with values in the insert statement
      const columnNames = Object.keys(values).filter((col) => {
        const column = columns.find(c => c.id === col)

        if (TIMESTAMP_FIELDS.includes(col as (typeof TIMESTAMP_FIELDS)[number])) {
          return true
        }

        if (column && column.type === 'boolean') {
          return true
        }

        if (values[col] !== undefined) {
          return true
        }

        return column && !column.isNullable && !column.defaultValue
      })

      if (columnNames.length === 0) {
        toast.error('No valid columns to insert')
        setIsSubmitting(false)
        return
      }

      const filteredColumnNames = columnNames.filter(col => values[col] !== '(Auto-generated)')

      const valueParams = filteredColumnNames.map(col =>
        prepareValue(values[col], columns.find(c => c.id === col)?.type),
      )

      await insertRecordQuery.run(database, {
        schema,
        table,
        columns: filteredColumnNames,
        values: valueParams,
      })

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
    }
    catch (error) {
      console.error('Error inserting record:', error)
      toast.error(`Failed to insert record: ${(error as Error).message}`)
    }
    finally {
      setIsSubmitting(false)
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

    // for boolean
    if (column.type === 'boolean') {
      // For boolean fields, ensure they always have a defined value (true/false)
      // Default to false for required fields
      const boolValue = value === true ? true : (value === false ? false : (!column.isNullable ? false : null))

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

    // for date / time
    if (column.type?.includes('time') || column.type?.includes('date')) {
      return (
        <Input
          id={`field-${column.id}`}
          value={value !== null && value !== undefined ? String(value) : ''}
          onChange={e => handleValueChange(column.id, e.target.value)}
          placeholder={column.type}
        />
      )
    }

    if (value === '(Auto-generated)') {
      return (
        <Input
          id={`field-${column.id}`}
          value={String(value)}
          disabled
          className="bg-muted/50 text-muted-foreground italic"
          placeholder={`Enter ${column.type}`}
        />
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
            <div key={column.id} className="grid grid-cols-5 items-center gap-4">
              <Label htmlFor={`field-${column.id}`} className="text-right col-span-1">
                {column.id}
                {!column.isNullable && <span className="text-red-500 ml-0.5">*</span>}
              </Label>
              <div className="col-span-3">
                {renderInputField(column)}
              </div>
              <div className="col-span-1">
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
