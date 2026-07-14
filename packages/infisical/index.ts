import process from 'node:process'

import { InfisicalSDK } from '@infisical/sdk'
import { type } from 'arktype'
import { memoize } from 'memoza'

import { secrets } from './secrets'

export const env = type({
  INFISICAL_SITE_URL: 'string',
  INFISICAL_CLIENT_ID: 'string',
  INFISICAL_CLIENT_SECRET: 'string',
  INFISICAL_PROJECT_ID: 'string',
  INFISICAL_ENVIRONMENT: 'string',
}).assert(process.env)

export const baseOptions = {
  projectId: env.INFISICAL_PROJECT_ID,
  environment: env.INFISICAL_ENVIRONMENT,
}

export const getClient = memoize(async () => {
  const client = new InfisicalSDK({ siteUrl: env.INFISICAL_SITE_URL })
  await client.auth().universalAuth.login({
    clientId: env.INFISICAL_CLIENT_ID,
    clientSecret: env.INFISICAL_CLIENT_SECRET,
  })
  return client
})

export function pathToString(path: string[]) {
  return path.length === 0 ? '/' : `/${path.join('/')}`
}

export function isFolderMissingError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('StatusCode=404')
}

export async function ensureFolders(folders: string[]) {
  if (folders.length === 0) return

  const client = await getClient()

  for (let i = 0; i < folders.length; i++) {
    const parent = i === 0 ? '/' : `/${folders.slice(0, i).join('/')}`
    // Sequential by design: each folder's parent must exist before it is created
    // eslint-disable-next-line no-await-in-loop
    await client
      .folders()
      .create({
        ...baseOptions,
        name: folders[i]!,
        path: parent,
      })
      .catch(() => {})
  }
}

export const infisical = {
  secrets,
}
