import type { API_KEY_PERMISSIONS } from '@conar/shared/constants'
import { type } from 'arktype'
import { auth } from '~/lib/auth'
import { authMiddleware, orpc } from '~/orpc'

export const create = orpc
  .use(authMiddleware)
  .input(type({
    name: 'string > 1',
    permissions: {
      '[string]': 'string[]',
    } as type.cast<{
      [K in keyof typeof API_KEY_PERMISSIONS]: typeof API_KEY_PERMISSIONS[K][number][]
    }>,
  }))
  .handler(async ({ context, input }) => {
    const created = await auth.api.createApiKey({
      body: {
        name: input.name,
        userId: context.user.id,
        permissions: input.permissions,
      },
    })

    return {
      id: created.id,
      key: created.key,
    }
  })
