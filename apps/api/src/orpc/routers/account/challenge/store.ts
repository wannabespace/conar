import { type } from 'arktype'
import { auth } from '~/lib/auth'
import { authMiddleware, orpc } from '~/orpc'
import { codeChallengePublisher } from '.'

export const store = orpc
  .use(authMiddleware)
  .input(type({
    'codeChallenge': 'string',
    'newUser?': 'boolean',
  }))
  .handler(async ({ input, context }) => {
    const { token } = await (await auth.$context).internalAdapter.createSession(context.user.id)

    codeChallengePublisher.publish(input.codeChallenge, { token, newUser: input.newUser })
  })
