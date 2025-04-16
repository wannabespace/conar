export interface SimpleUser {
  name: string | null
  email: string | null
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  starred_at?: string
  user_view_type?: string
}

export interface ReleaseAsset {
  url: string
  browser_download_url: string
  id: number
  node_id: string
  name: string
  label: string | null
  state: 'uploaded' | 'open'
  content_type: string
  size: number
  download_count: number
  created_at: string
  updated_at: string
  uploader: SimpleUser | null
}

export interface Reactions {
  'url': string
  'total_count': number
  '+1': number
  '-1': number
  'laugh': number
  'confused': number
  'heart': number
  'hooray': number
  'eyes': number
  'rocket': number
}

export interface Release {
  url: string
  html_url: string
  assets_url: string
  upload_url: string
  tarball_url: string | null
  zipball_url: string | null
  id: number
  node_id: string
  tag_name: string
  target_commitish: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  created_at: string
  published_at: string | null
  author: SimpleUser
  assets: ReleaseAsset[]
  body_html?: string
  body_text?: string
  mentions_count?: number
  discussion_url?: string
  reactions?: Reactions
}

export async function getLatestRelease(): Promise<Release> {
  const response = await fetch(
    'https://api.github.com/repos/wannabespace/connnect/releases/latest',
  )
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}
