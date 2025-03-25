import { z } from 'zod'

export const databaseContextSchema = z.object({
  schemas: z.array(z.object({
    schema: z.string(),
    tables: z.array(z.object({
      name: z.string(),
      columns: z.array(z.object({
        name: z.string(),
        type: z.string(),
        nullable: z.boolean(),
        default: z.string().nullable(),
      })),
    })).nullable(),
  })),
  enums: z.array(z.object({
    schema: z.string(),
    name: z.string(),
    value: z.string(),
  })),
})
