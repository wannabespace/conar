import process from 'node:process'

import { db } from '@tamery/db'
import { connections, members, users } from '@tamery/db/schema'
import { infisical } from '@tamery/infisical'
import { decrypt, encrypt } from '@tamery/shared/crypto-node'
import { toError } from '@tamery/shared/utils'
import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { INFISICAL_USER_ENCRYPTION_SECRET_NAME } from '~/constants'

// Rotates every user's Infisical ENCRYPTION_SECRET and re-encrypts the connection
// strings it guards in lockstep. A workspace decrypts with its earliest owner's
// secret (getWorkspaceSecret), so each workspace's rows are rotated under that
// owner. Dry run by default: reads and decrypts everything to prove the rotation
// will succeed, writes nothing. Pass --execute to rotate.
const execute = process.argv.includes('--execute')

const ownerMembers = await db
  .select({ userId: members.userId, workspaceId: members.workspaceId })
  .from(members)
  .where(eq(members.role, 'owner'))
  .orderBy(asc(members.createdAt))

const workspaceOwner = new Map<string, string>()
for (const { userId, workspaceId } of ownerMembers) {
  if (!workspaceOwner.has(workspaceId)) {
    workspaceOwner.set(workspaceId, userId)
  }
}

const ownedWorkspaces = new Map<string, string[]>()
for (const [workspaceId, userId] of workspaceOwner) {
  const owned = ownedWorkspaces.get(userId)
  if (owned) {
    owned.push(workspaceId)
  } else {
    ownedWorkspaces.set(userId, [workspaceId])
  }
}

const rotateUser = async (userId: string, workspaceIds: string[]) => {
  let oldSecret: string
  try {
    oldSecret = await infisical.secrets.get({
      name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
      path: ['users', userId],
    })
  } catch (error) {
    return { error: `secret read failed: ${toError(error).message}` }
  }

  const rows = workspaceIds.length
    ? await db
        .select({
          connectionString: connections.connectionString,
          id: connections.id,
        })
        .from(connections)
        .where(
          and(
            inArray(connections.workspaceId, workspaceIds),
            isNotNull(connections.connectionString)
          )
        )
    : []

  const plaintexts: { id: string; text: string }[] = []
  for (const row of rows) {
    if (!row.connectionString) {
      continue
    }

    const encryptedText = row.connectionString
    try {
      plaintexts.push({
        id: row.id,
        text: decrypt({ encryptedText, secret: oldSecret }),
      })
    } catch {
      return {
        error: `connection ${row.id} does not decrypt with the current secret`,
      }
    }
  }

  if (!execute) {
    return { connections: plaintexts.length }
  }

  const newSecret = nanoid()

  // Promote the key inside the transaction: if Infisical rejects (the common
  // failure), the row updates roll back and the old key with its old rows stay
  // consistent, so a rerun starts clean. The only unrecoverable window is a hard
  // crash during the commit after Infisical already took the new key, when the old
  // key is gone but the rows rolled back to it; see the key-version note in
  // IMPROVEMENTS.md for the format change that would close it.
  try {
    await db.transaction(async (tx) => {
      for (const { id, text } of plaintexts) {
        // oxlint-disable-next-line no-await-in-loop -- one statement per row, each a distinct ciphertext on one tx connection
        await tx
          .update(connections)
          .set({ connectionString: encrypt({ secret: newSecret, text }) })
          .where(eq(connections.id, id))
      }

      await infisical.secrets.update({
        name: INFISICAL_USER_ENCRYPTION_SECRET_NAME,
        path: ['users', userId],
        value: newSecret,
      })
    })
  } catch (error) {
    return {
      error: `rotation aborted, no changes applied: ${toError(error).message}`,
    }
  }

  return { connections: plaintexts.length }
}

const allUsers = await db.select({ id: users.id }).from(users)

let rotated = 0
let reEncrypted = 0
const failures: string[] = []

for (const { id } of allUsers) {
  // oxlint-disable-next-line no-await-in-loop -- sequential by design: each user's DB and Infisical writes must settle before the next
  const result = await rotateUser(id, ownedWorkspaces.get(id) ?? [])

  if ('error' in result) {
    failures.push(`${id}: ${result.error}`)
    console.error(`✗ ${id}: ${result.error}`)
    continue
  }

  rotated += 1
  reEncrypted += result.connections
}

console.log(
  execute
    ? `Rotated ${rotated} user secret(s); re-encrypted ${reEncrypted} connection string(s).`
    : `Dry run: ${rotated} user secret(s) ready to rotate, ${reEncrypted} connection string(s) verified decryptable. Re-run with --execute to apply.`
)

if (failures.length) {
  console.error(`${failures.length} user(s) skipped; resolve before rerunning.`)
  process.exit(1)
}

process.exit(0)
