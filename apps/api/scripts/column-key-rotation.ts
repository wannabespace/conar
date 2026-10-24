import * as crypto from 'node:crypto'
import process from 'node:process'

import { db } from '@tamery/db'
import { decrypt, encrypt } from '@tamery/shared/crypto-node'
import { toError } from '@tamery/shared/utils'
import { sql } from 'drizzle-orm'

// Rotates a secret that wraps encrypted columns at rest (ENCRYPTION_SECRET,
// USER_KEY_SECRET). The column types in `@tamery/db` bind the current secret at
// module load, so this reads and writes the raw ciphertext through `sql` rather
// than the ORM, decrypting with the old secret and re-encrypting with the new one.
// Because the key lives in env, not a store this process writes, the swap is a
// separate step: the whole DB flips atomically here, then the operator sets the env
// value and redeploys. Until that redeploy the running app cannot decrypt the
// columns, so run it in a maintenance window. IMPROVEMENTS.md tracks the key-version
// format that would make this zero-downtime.

const SECRET_BYTES = 32

interface EncryptedColumn {
  column: string
  key: string
  table: string
}

const reencrypt = async ({
  columns,
  execute,
  newSecret,
  oldSecret,
}: {
  columns: EncryptedColumn[]
  execute: boolean
  newSecret: string
  oldSecret: string
}) => {
  const migrations: { cipher: string; column: EncryptedColumn; id: string }[] =
    []

  for (const column of columns) {
    // oxlint-disable-next-line no-await-in-loop -- read every column before any write, so a decrypt failure aborts untouched
    const { rows } = await db.execute<{ cipher: string; id: string }>(
      sql`select ${sql.identifier(column.key)} as id, ${sql.identifier(column.column)} as cipher from ${sql.identifier(column.table)} where ${sql.identifier(column.column)} is not null`
    )

    for (const row of rows) {
      try {
        migrations.push({
          cipher: encrypt({
            secret: newSecret,
            text: decrypt({ encryptedText: row.cipher, secret: oldSecret }),
          }),
          column,
          id: row.id,
        })
      } catch {
        return {
          error: `${column.table}.${column.column} ${row.id} does not decrypt with the current secret`,
        }
      }
    }
  }

  if (!execute) {
    return { reEncrypted: migrations.length }
  }

  try {
    await db.transaction(async (tx) => {
      for (const { cipher, column, id } of migrations) {
        // oxlint-disable-next-line no-await-in-loop -- one statement per row, each a distinct ciphertext on one tx connection
        await tx.execute(
          sql`update ${sql.identifier(column.table)} set ${sql.identifier(column.column)} = ${cipher} where ${sql.identifier(column.key)} = ${id}`
        )
      }
    })
  } catch (error) {
    return {
      error: `rotation aborted, no changes applied: ${toError(error).message}`,
    }
  }

  return { reEncrypted: migrations.length }
}

export const runColumnKeyRotation = async ({
  columns,
  oldSecret,
  secretName,
}: {
  columns: EncryptedColumn[]
  oldSecret: string
  secretName: string
}) => {
  const execute = process.argv.includes('--execute')
  const provided = process.argv
    .find((arg) => arg.startsWith('--new='))
    ?.slice('--new='.length)

  if (execute && !provided) {
    console.error(
      `Pass --new=<secret> with --execute: generate it, set ${secretName} to it in the secret store first, then rotate and redeploy. A dry run prints a candidate.`
    )
    process.exit(1)
  }

  const newSecret =
    provided ?? crypto.randomBytes(SECRET_BYTES).toString('base64url')

  const result = await reencrypt({ columns, execute, newSecret, oldSecret })

  if ('error' in result) {
    console.error(result.error)
    process.exit(1)
  }

  if (execute) {
    console.log(
      `Re-encrypted ${result.reEncrypted} value(s). Set ${secretName} in the secret store and redeploy the API; encrypted columns do not decrypt until then.`
    )
  } else {
    console.log(
      `Dry run: ${result.reEncrypted} value(s) verified decryptable with the current ${secretName}. To rotate: --execute --new=<secret>. Candidate:\n${newSecret}`
    )
  }

  process.exit(0)
}
