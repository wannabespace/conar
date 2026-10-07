import { db } from '@conar/db'
import { generateText } from 'ai'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

import { openrouter } from '~/lib/openrouter'

function createAnswer(status: 'error' | 'ok', service: string, message: string) {
  return {
    status,
    service,
    message,
  }
}

export const healthRouter = new Hono().get('/', async c => {
  const hostname = c.req.header('host')
  if (hostname !== 'healthcheck.railway.app') {
    return c.json(
      {
        status: 'error',
        message: 'Invalid healthcheck host',
      },
      400,
    )
  }

  const promises = await Promise.all([
    db
      .execute(sql`select 1`)
      .then(() => createAnswer('ok', 'database', 'Database connection ok'))
      .catch(e =>
        createAnswer(
          'error',
          'database',
          e instanceof Error ? e.message : 'Database connection failed',
        ),
      ),
    generateText({
      model: openrouter('openai/gpt-5-nano'),
      prompt: 'Hello, how are you?',
    })
      .then(result => {
        if (!result.text) {
          return createAnswer('error', 'openrouter', 'OpenRouter connection failed')
        }

        return createAnswer('ok', 'openrouter', result.text)
      })
      .catch(e =>
        createAnswer(
          'error',
          'openrouter',
          e instanceof Error ? e.message : 'OpenRouter connection failed',
        ),
      ),
  ])

  const error = promises.find(promise => promise.status === 'error')

  if (error) {
    return c.json(error, 500)
  }

  return c.json({
    status: 'ok',
  })
})
