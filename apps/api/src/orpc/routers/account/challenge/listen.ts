import { type } from 'arktype'
import { orpc } from '~/orpc'
import { codeChallengePublisher } from '.'

export const listen = orpc
  .input(type({
    codeChallenge: 'string',
  }))
  .handler(async function* ({ input, signal }) {
    for await (const payload of codeChallengePublisher.subscribe(input.codeChallenge, { signal })) {
      yield payload
    }
  })
