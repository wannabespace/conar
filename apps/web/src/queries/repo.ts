import { Octokit } from '@octokit/rest'
import { queryOptions } from '@tanstack/react-query'
import { createCache } from '~/utils/cache'

const repoKey = 'OCTOKIT_REPO'

async function fetchRepo() {
  const octokit = new Octokit()
  const { data } = await octokit.repos.get({
    owner: 'wannabespace',
    repo: 'conar',
  })

  return data
}

type Repo = Awaited<ReturnType<typeof fetchRepo>>

const repoCache = createCache<Repo>({
  key: repoKey,
  hours: 3,
})

export const getRepoOptions = queryOptions({
  queryKey: ['octokit', 'get'],
  queryFn: async () => {
    const cached = repoCache.get()
    if (cached)
      return cached

    const data = await fetchRepo()

    repoCache.set(data)
    return data
  },
})
