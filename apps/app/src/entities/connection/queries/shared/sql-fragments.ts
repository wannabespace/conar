import { sql } from 'kysely'

export const identifiers = (values: string[]) =>
  sql.join(values.map((value) => sql.id(value)))

export const literals = (values: string[]) =>
  sql.join(values.map((value) => sql.lit(value)))
