import type { databases } from '~/drizzle'
import type { Column } from '~/entities/database/utils/table'
import { Button } from '@conar/ui/components/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { Input } from '@conar/ui/components/input'
import { Label } from '@conar/ui/components/label'
import { Switch } from '@conar/ui/components/switch'
import { useImperativeHandle, useState } from 'react'
import { toast } from 'sonner'
import { v7 } from 'uuid'
import { databaseRowsQuery, executeSql } from '~/entities/database'
import { queryClient } from '~/main'

interface ExtendedColumn extends Column {
  defaultValue?: string | null
  isPrimary?: boolean
}

interface DatabaseColumn {
  id: string
  type: string
  is_nullable: boolean
  default_value: string | null
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
    let query = ''
    let params: unknown[] = []

    if (db.type === 'postgres') {
      query = `
        SELECT 
          kcu.column_name, 
          c.column_default,
          c.is_nullable,
          c.data_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.columns c
          ON c.column_name = kcu.column_name
          AND c.table_name = kcu.table_name
          AND c.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `
      params = [schema, tableName]
    }
    else if (db.type === 'mysql') {
      query = `
        SELECT 
          k.COLUMN_NAME as column_name, 
          c.COLUMN_DEFAULT as column_default,
          c.IS_NULLABLE as is_nullable,
          c.DATA_TYPE as data_type
        FROM information_schema.TABLE_CONSTRAINTS t
        JOIN information_schema.KEY_COLUMN_USAGE k
          USING(CONSTRAINT_NAME, TABLE_SCHEMA, TABLE_NAME)
        JOIN information_schema.COLUMNS c
          ON c.COLUMN_NAME = k.COLUMN_NAME
          AND c.TABLE_NAME = k.TABLE_NAME
          AND c.TABLE_SCHEMA = k.TABLE_SCHEMA
        WHERE t.CONSTRAINT_TYPE = 'PRIMARY KEY'
          AND t.TABLE_SCHEMA = ?
          AND t.TABLE_NAME = ?
      `
      params = [schema, tableName]
    }

    if (!query)
      return []

    try {
      const result = await executeSql(db, query, params)
      return result.rows as PrimaryKeyInfo[]
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

        const columnsResult = await executeSql(
          db,
          `SELECT 
            column_name as id, 
            data_type as type,
            is_nullable = 'YES' as is_nullable,
            column_default as default_value
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position`,
          [sch, tbl],
        )

        const tableColumns = columnsResult.rows.map((col: unknown) => {
          const typedCol = col as DatabaseColumn
          return {
            id: typedCol.id,
            type: typedCol.type,
            isNullable: typedCol.is_nullable,
            defaultValue: typedCol.default_value,
            isEditable: true,
            isPrimary: pkInfo.some(pk => pk.column_name === typedCol.id),
          }
        })

        setColumns(tableColumns)

        const initialValues: Record<string, unknown> = {}

        tableColumns.forEach((col) => {
          const isPrimary = pkInfo.some(pk => pk.column_name === col.id)
          const hasAutoDefault = col.defaultValue
            && (col.defaultValue.includes('nextval') // PostgreSQL sequences
              || col.defaultValue.includes('uuid_generate') // PostgreSQL UUID functions
              || col.defaultValue.includes('auto_increment')) // MySQL auto increment

          if (isPrimary && !hasAutoDefault) {
            if (col.type === 'uuid') {
              initialValues[col.id] = v7()
            }
            else if (col.type.includes('int') || col.type.includes('serial')) {
              // database handle
            }
            else {
              initialValues[col.id] = null
            }
          }

          else if (!hasAutoDefault) {
            initialValues[col.id] = null
          }

          if (col.id === 'created_at'
            || col.id === 'updated_at'
            || col.id === 'createdAt'
            || col.id === 'updatedAt'
            || col.id === 'creation_date'
            || col.id === 'update_date'
            || col.id === 'creation_time'
            || col.id === 'update_time'
            || col.id === 'timestamp') {
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
      // assuming default values
      const timestampFields = ['created_at', 'updated_at', 'createdAt', 'updatedAt', 'creation_date', 'update_date', 'creation_time', 'update_time', 'timestamp']

      // Add any missing timestamp fields with current date
      timestampFields.forEach((field) => {
        if (columns.some(col => col.id === field) && values[field] === undefined) {
          values[field] = new Date()
        }
      })

      // Make sure boolean fields are properly handled (including false values)
      columns.forEach((col) => {
        // If it's a boolean field and not yet set, make sure it has a proper boolean value
        if (col.type === 'boolean' && (values[col.id] === undefined || values[col.id] === null)) {
          // For required boolean fields, default to false rather than null
          values[col.id] = !col.isNullable ? false : null
        }
      })

      // Ensure we include all required fields and fields with values in the insert statement
      const columnNames = Object.keys(values).filter((col) => {
        const column = columns.find(c => c.id === col)

        if (timestampFields.includes(col)) {
          return true
        }

        // Always include boolean fields - both true and false values
        if (column && column.type === 'boolean') {
          return true
        }

        // Include any field that has a defined value
        if (values[col] !== undefined) {
          return true
        }

        // Include required fields without defaults
        return column && !column.isNullable && !column.defaultValue
      })

      if (columnNames.length === 0) {
        toast.error('No valid columns to insert')
        setIsSubmitting(false)
        return
      }

      let placeholders: string
      if (database.type === 'mysql') {
        placeholders = columnNames.map(() => '?').join(', ')
      }
      else {
        placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ')
      }

      const valueParams = columnNames.map(col =>
        prepareValue(values[col], columns.find(c => c.id === col)?.type),
      )

      //  appropriate identifier quoting based on database type
      let columnIdentifiers: string
      if (database.type === 'mysql') {
        columnIdentifiers = columnNames.map(col => `\`${col}\``).join(', ')
      }
      else {
        // PostgreSQL uses double quotes for identifiers
        columnIdentifiers = columnNames.map(col => `"${col}"`).join(', ')
      }

      // Schema and table identifiers
      let tableIdentifier: string
      if (database.type === 'mysql') {
        tableIdentifier = `\`${schema}\`.\`${table}\``
      }
      else {
        tableIdentifier = `"${schema}"."${table}"`
      }

      const sql = `
        INSERT INTO ${tableIdentifier} 
        (${columnIdentifiers})
        VALUES (${placeholders})
      `

      await executeSql(database, sql, valueParams)

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
