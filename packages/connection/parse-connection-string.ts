import { SafeURL } from '@tamery/shared/utils/safe-url'

export interface Config {
  user?: string
  password?: string
  host: string
  port?: number
  database?: string
  searchParams: URLSearchParams
}

export const parseConnectionString = (connectionString: string): Config => {
  const parsed = new SafeURL(connectionString)

  return {
    database:
      parsed.pathname && parsed.pathname !== '/'
        ? parsed.pathname.slice(1)
        : undefined,
    host: parsed.hostname,
    password: parsed.password || undefined,
    port: parsed.port ? Math.trunc(Number(parsed.port)) : undefined,
    searchParams: parsed.searchParams,
    user: parsed.username || undefined,
  }
}
