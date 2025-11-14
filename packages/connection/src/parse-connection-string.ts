import { SafeURL } from '@conar/shared/utils/safe-url'

export interface Config {
  user?: string
  password?: string
  host: string
  port?: number
  database?: string
  searchParams: URLSearchParams
}

export function parseConnectionString(connectionString: string): Config {
  const parsed = new SafeURL(connectionString)

  return {
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : undefined,
    database: parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : undefined,
    searchParams: parsed.searchParams,
  }
}
