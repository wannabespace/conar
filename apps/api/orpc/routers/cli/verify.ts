import { type } from 'arktype'
import { orpc } from '~/orpc'

export const verify = orpc
  .input(type({
    token: 'string',
  }))
  .handler(async function () {

  })
