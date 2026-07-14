import { Result } from 'better-result'

import { baseOptions, ensureFolders, getClient, isFolderMissingError, pathToString } from '.'

interface SecretLocation {
  path: string[]
  name: string
}

export const secrets = {
  async get(opts: SecretLocation) {
    const client = await getClient()
    const secretPath = pathToString(opts.path)

    const result = await client.secrets().getSecret({
      ...baseOptions,
      secretName: opts.name,
      secretPath,
    })
    return result.secretValue
  },

  async set(opts: SecretLocation & { value: string }) {
    const client = await getClient()
    const secretPath = pathToString(opts.path)

    const result = await Result.tryPromise(
      {
        try: () =>
          client.secrets().createSecret(opts.name, {
            ...baseOptions,
            secretPath,
            secretValue: opts.value,
          }),
        catch: async (error: unknown) => {
          if (isFolderMissingError(error)) await ensureFolders(opts.path)

          return error
        },
      },
      {
        retry: {
          times: 1,
          delayMs: 0,
          backoff: 'constant',
          shouldRetry: isFolderMissingError,
        },
      },
    )

    if (Result.isError(result)) throw result.error
  },

  async update(opts: SecretLocation & { value: string }) {
    const client = await getClient()
    const secretPath = pathToString(opts.path)

    await client.secrets().updateSecret(opts.name, {
      ...baseOptions,
      secretPath,
      secretValue: opts.value,
    })
  },

  async delete(opts: SecretLocation) {
    const client = await getClient()
    const secretPath = pathToString(opts.path)

    await client.secrets().deleteSecret(opts.name, {
      ...baseOptions,
      secretPath,
    })
  },
}
