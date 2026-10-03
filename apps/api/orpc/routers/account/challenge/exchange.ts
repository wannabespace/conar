import { db } from '@tamery/db'
import {
  connections,
  members,
  queries,
  sessions,
  workspaces,
} from '@tamery/db/schema'
import { challenge } from '@tamery/shared/challenge'
import { decrypt, encrypt } from '@tamery/shared/crypto-node'
import { type } from 'arktype'
import { eq, inArray, sql } from 'drizzle-orm'

import { auth } from '~/lib/auth'
import { ensureDefaultWorkspace } from '~/lib/workspace'
import { getWorkspaceSecret, orpc } from '~/orpc'

import { codeChallengeRedis } from './code-challenge'

const adoptAnonymousUser = async (anonymousUserId: string, userId: string) => {
  const workspaceId = await ensureDefaultWorkspace(userId)
  const secret = await getWorkspaceSecret(workspaceId)

  await db.transaction(async (tx) => {
    // Same lock as connections.create: a connection the guest saves mid-adoption
    // would otherwise miss the move and die with the guest's workspace.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${anonymousUserId}))`
    )

    const [rows, anonymousMembers] = await Promise.all([
      tx
        .select()
        .from(connections)
        .where(eq(connections.userId, anonymousUserId)),
      tx
        .select({ workspaceId: members.workspaceId })
        .from(members)
        .where(eq(members.userId, anonymousUserId)),
    ])

    await Promise.all(
      rows.map(async (row) =>
        tx
          .update(connections)
          .set({
            connectionString:
              row.connectionString &&
              encrypt({
                secret,
                text: decrypt({
                  encryptedText: row.connectionString,
                  secret: await getWorkspaceSecret(row.workspaceId),
                }),
              }),
            userId,
            workspaceId,
          })
          .where(eq(connections.id, row.id))
      )
    )
    await tx
      .update(queries)
      .set({ userId })
      .where(eq(queries.userId, anonymousUserId))
    await tx.delete(workspaces).where(
      inArray(
        workspaces.id,
        anonymousMembers.map((member) => member.workspaceId)
      )
    )
  })

  const context = await auth.$context
  await context.internalAdapter.deleteUser(anonymousUserId)
}

export const exchange = orpc
  .input(
    type({
      codeChallenge: 'string',
      type: '"crypto" | "noble" = "crypto"',
      verifier: 'string',
    })
  )
  .errors({
    FORBIDDEN: {
      message: "We couldn't authenticate you. Please try signing in again.",
    },
    NOT_ACCEPTABLE: {
      message: "We couldn't authenticate you. Please try signing in again.",
    },
  })
  .handler(async ({ errors, input, context: { headers } }) => {
    const generatedCodeChallenge = await challenge[input.type].generateCode(
      input.verifier
    )

    if (generatedCodeChallenge !== input.codeChallenge) {
      throw errors.NOT_ACCEPTABLE()
    }

    const data = await codeChallengeRedis.get(input.codeChallenge)

    if (!data) {
      throw errors.FORBIDDEN()
    }

    const current = await auth.api.getSession({ headers })

    if (current?.user.isAnonymous) {
      await adoptAnonymousUser(current.user.id, data.userId).catch((error) => {
        console.error(
          `Failed to adopt anonymous user ${current.user.id} into ${data.userId}`,
          error
        )
      })
    }

    const context = await auth.$context
    const { token, id } = await context.internalAdapter.createSession(
      data.userId
    )
    await Promise.all([
      codeChallengeRedis.delete(input.codeChallenge),
      db
        .update(sessions)
        .set({
          ipAddress: headers.get('X-Forwarded-For'),
          userAgent: headers.get('User-Agent'),
        })
        .where(eq(sessions.id, id)),
    ])
    return { newUser: data.newUser, token }
  })
