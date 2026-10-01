import { sql } from 'kysely'

export const identifiers = (values: string[]) =>
  sql.join(values.map((value) => sql.id(value)))

export const literals = (values: string[]) =>
  sql.join(values.map((value) => sql.lit(value)))

// sp_rename and OBJECT_ID take a name as a string, so a name holding a dot or a
// bracket only parses when every part is delimited.
export const mssqlQualified = (...parts: string[]) =>
  parts.map((part) => `[${part.replaceAll(']', ']]')}]`).join('.')

// MySQL reports a definer as "user@host"; a host never holds "@", a user may.
export const mysqlDefiner = (definer: string | undefined) => {
  if (!definer) {
    return sql``
  }
  const at = definer.lastIndexOf('@')

  return sql`DEFINER = ${sql.lit(definer.slice(0, at))}@${sql.lit(definer.slice(at + 1))}`
}
