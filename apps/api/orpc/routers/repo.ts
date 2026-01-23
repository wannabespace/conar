import { GITHUB_REPO_NAME, GITHUB_REPO_OWNER } from '@conar/shared/constants'
import { octokit } from '~/lib/octokit'
import { cacheMiddleware, orpc } from '~/orpc'

export const repo = orpc
  .use(cacheMiddleware(60 * 60))
  .handler(async () => {
    const { data } = await octokit.repos.get({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
    })

    return data
  })
