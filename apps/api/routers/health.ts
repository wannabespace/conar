import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import { db } from '@conar/db'
import { generateText } from 'ai'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'

export const healthRouter = new Hono()
  .get('/', async (c) => {
    const hostname = c.req.header('host')
    if (hostname !== 'healthcheck.railway.app') {
      return c.json({
        status: 'error',
        message: 'Invalid healthcheck host',
      }, 400)
    }

    function createAnswer(status: 'error' | 'ok', service: string, message: string) {
      return {
        status,
        service,
        message,
      }
    }

    const promises = await Promise.all([
      db
        .execute(sql`select 1`)
        .then(() => createAnswer('ok', 'database', 'Database connection ok'))
        .catch(e => createAnswer('error', 'database', e instanceof Error ? e.message : 'Database connection failed')),
      generateText({
        model: openai('gpt-5-nano'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'openai', 'OpenAI connection failed')
          }

          return createAnswer('ok', 'openai', result.text)
        })
        .catch(e => createAnswer('error', 'openai', e instanceof Error ? e.message : 'OpenAI connection failed')),
      generateText({
        model: google('gemini-flash-latest'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'google', 'Google connection failed')
          }

          return createAnswer('ok', 'google', result.text)
        })
        .catch(e => createAnswer('error', 'google', e instanceof Error ? e.message : 'Google connection failed')),
      generateText({
        model: anthropic('claude-opus-4-6'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'anthropic', 'Anthropic connection failed')
          }

          return createAnswer('ok', 'anthropic', result.text)
        })
        .catch(e => createAnswer('error', 'anthropic', e instanceof Error ? e.message : 'Anthropic connection failed')),
      generateText({
        model: xai('grok-4-latest'),
        prompt: 'Hello, how are you?',
      })
        .then((result) => {
          if (!result.text) {
            return createAnswer('error', 'xai', 'XAI connection failed')
          }

          return createAnswer('ok', 'xai', result.text)
        })
        .catch(e => createAnswer('error', 'xai', e instanceof Error ? e.message : 'XAI connection failed')),
    ])

    const error = promises.find(promise => promise.status === 'error')

    if (error) {
      return c.json(error, 500)
    }

    return c.json({
      status: 'ok',
    })
  })
