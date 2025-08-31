export function parseUrl(url: string): URL {
  // eslint-disable-next-line regexp/no-super-linear-backtracking -- vibe coded
  const urlRegex = /^([a-z][a-z\d+\-.]*):\/\/(?:([^:@/\s]*)(?::([^@/\s]*))?@)?([^:/\s]+|\[[^\]]+\])(?::(\d+))?(?:\/([^?#\s]*))?(?:\?([^#\s]*))?(?:#(.*))?$/i

  const match = url.match(urlRegex)

  if (!match) {
    throw new TypeError(`Invalid URL format: ${url}`)
  }

  const [
    ,
    protocol,
    username,
    password,
    hostname,
    port,
    pathname,
    search,
    hash,
  ] = match

  const searchParams = new URLSearchParams()

  if (search) {
    search.split('&').forEach((param) => {
      const [key, value] = param.split('=')

      if (key) {
        searchParams.append(
          decodeURIComponent(key),
          value ? decodeURIComponent(value) : '',
        )
      }
    })
  }

  return {
    protocol: `${protocol}:`,
    username: typeof username === 'string' ? username : '',
    password: typeof password === 'string' ? password : '',
    hostname,
    port: port || '',
    pathname: pathname ? `/${pathname}` : '/',
    search: search ? `?${search}` : '',
    hash: typeof hash === 'string' ? `#${hash}` : '',
    searchParams,
    origin: `${protocol}://${hostname}${port ? `:${port}` : ''}`,
    host: hostname + (port ? `:${port}` : ''),
    href: url,
    toString() {
      return url
    },
    toJSON() {
      return url
    },
  }
}
