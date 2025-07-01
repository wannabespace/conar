import * as z from 'zod/v4'

export const databaseContextSchema = z.object({
  schemas: z.array(z.object({
    schema: z.string(),
    tables: z.array(z.object({
      name: z.string(),
      columns: z.array(z.object({
        name: z.string(),
        type: z.string(),
        nullable: z.boolean(),
        default: z.nullable(z.string()),
        editable: z.boolean(),
      })).nullable().transform(data => data ?? []),
    })).nullable().transform(data => data ?? []),
  })).nullable().transform(data => data ?? []),
  enums: z.array(z.object({
    schema: z.string(),
    name: z.string(),
    value: z.string(),
  })).nullable().transform(data => data ?? []),
})
