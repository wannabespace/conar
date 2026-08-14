import process from 'node:process'

import { InfisicalSDK } from '@infisical/sdk'
import { type } from 'arktype'
import { memoize } from 'memoza'

import { secrets } from './secrets'

export const env = type({
  INFISICAL_CLIENT_ID: 'string',
  INFISICAL_CLIENT_SECRET: 'string',
  INFISICAL_ENVIRONMENT: 'string',
  INFISICAL_PROJECT_ID: 'string',
  INFISICAL_SITE_URL: 'string',
}).assert(process.env)

export const baseOptions = {
  environment: env.INFISICAL_ENVIRONMENT,
  projectId: env.INFISICAL_PROJECT_ID,
}

export const getClient = memoize(async () => {
  const client = new InfisicalSDK({ siteUrl: env.INFISICAL_SITE_URL })
  await client.auth().universalAuth.login({
    clientId: env.INFISICAL_CLIENT_ID,
    clientSecret: env.INFISICAL_CLIENT_SECRET,
  })
  return client
})

export const pathToString = (path: string[]) =>
  path.length === 0 ? '/' : `/${path.join('/')}`

export const isFolderMissingError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes('StatusCode=404')

export const ensureFolders = async (folders: string[]) => {
  if (folders.length === 0) {
    return
  }

  const client = await getClient()

  for (let i = 0; i < folders.length; i += 1) {
    const folderName = folders[i]
    if (!folderName) {
      continue
    }
    const parent = i === 0 ? '/' : `/${folders.slice(0, i).join('/')}`
    try {
      // oxlint-disable-next-line no-await-in-loop
      await client.folders().create({
        ...baseOptions,
        name: folderName,
        path: parent,
      })
    } catch {
      // folder may already exist
    }
  }
}

export const infisical = {
  secrets,
}
