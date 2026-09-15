import { sql } from 'kysely'

export const identifiers = (values: string[]) =>
  sql.join(values.map((value) => sql.id(value)))

export const literals = (values: string[]) =>
  sql.join(values.map((value) => sql.lit(value)))

// sp_rename and OBJECT_ID take a name as a string, so a name holding a dot or a
// bracket only parses when every part is delimited.
export const mssqlQualified = (...parts: string[]) =>
  parts.map((part) => `[${part.replaceAll(']', ']]')}]`).join('.')
