import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { GITHUB_REPO_NAME, GITHUB_REPO_OWNER } from '@conar/shared/constants'
import { Octokit } from '@octokit/rest'
import { ORPCError } from '@orpc/server'
import { env } from '~/env'
import { orpc } from '~/orpc'

// https://www.todesktop.com/electron/docs/guides/release-webhooks#webhook-payload
interface ToDesktopWebhookPayload {
  appId: string
  buildId: string
  userId: string
  buildStartedAt: string
  buildEndedAt: string
  appName: string
  appVersion: string
  appNotarizaionBundleId?: string
  electronVersionUsed: string
  electronVersionSpecified: string
  sourcePackageManager: string
  versionControlInfo?: {
    branchName: string
    commitDate: string
    commitId: string
    commitMessage: string
    hasUncommittedChanges: boolean
    repositoryRemoteUrl: string
    versionControlSystemName: string
  }
  releaseInfo: {
    latestReleaseBuildId?: string
    releaseRedirections?: Array<object>
  }
}

function verifyWebhookSignature(requestBody: string, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(requestBody)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  )
}

export const todesktop = orpc.handler(async ({ context }) => {
  const webhookSecret = env.TODESKTOP_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'TODESKTOP_WEBHOOK_SECRET is not set' })
  }

  if (!env.GITHUB_TOKEN) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'GITHUB_TOKEN is not set' })
  }

  const rawBody = await context.request.text()
  const signature = context.request.headers.get('X-ToDesktop-HMAC-SHA256')

  if (!signature) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Missing X-ToDesktop-HMAC-SHA256 header' })
  }

  const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)

  if (!isValid) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Invalid webhook signature' })
  }

  try {
    const payload = JSON.parse(rawBody) as ToDesktopWebhookPayload

    const tagName = `v${payload.appVersion}`
    const releaseName = payload.appVersion

    const octokit = new Octokit({
      auth: env.GITHUB_TOKEN,
    })

    const { data: release } = await octokit.rest.repos.createRelease({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      tag_name: tagName,
      name: releaseName,
      draft: true,
      generate_release_notes: true,
      target_commitish: payload.versionControlInfo?.commitId || undefined,
    })

    context.addLogData({
      release: {
        tagName: release.tag_name,
        id: release.id,
        url: release.html_url,
      },
      build: {
        id: payload.buildId,
        appVersion: payload.appVersion,
      },
    })
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: errorMessage,
    })
  }
})
