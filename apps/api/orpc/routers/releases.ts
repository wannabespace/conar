import { GITHUB_REPO_NAME, GITHUB_REPO_OWNER } from '@conar/shared/constants'
import { octokit } from '~/lib/octokit'
import { cacheMiddleware, orpc } from '~/orpc'

export const releases = orpc
  .use(cacheMiddleware(60 * 60))
  .handler(async () => {
    const { data } = await octokit.repos.listReleases({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
    })

    return data.map(release => ({
      id: release.id,
      name: release.name,
      tagName: release.tag_name,
      createdAt: release.created_at,
      publishedAt: release.published_at,
      body: release.body,
    }))
  })
