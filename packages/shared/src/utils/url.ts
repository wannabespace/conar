// eslint-disable-next-line regexp/no-super-linear-backtracking
const urlRegex = /^([a-z][a-z\d+\-.]*):\/\/(?:([^:@/\s]*)(?::([^@/\s]*))?@)?([^:/\s]+|\[[^\]]+\])(?::(\d+))?(?:\/([^?#\s]*))?(?:\?([^#\s]*))?(?:#(.*))?$/i

export class SafeURL implements URL {
  protocol!: string
  username!: string
  password!: string
  hostname!: string
  port!: string
  pathname!: string
  search!: string
  hash!: string
  href!: string

  constructor(url: string) {
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

    this.protocol = `${protocol}:`
    this.username = typeof username === 'string' ? username : ''
    this.password = typeof password === 'string' ? password : ''
    this.hostname = hostname
    this.port = port || ''
    this.pathname = pathname ? `/${pathname}` : '/'
    this.search = search ? `?${search}` : ''
    this.hash = typeof hash === 'string' ? `#${hash}` : ''
    this.href = url
  }

  get searchParams() {
    const searchParams = new URLSearchParams()

    if (this.search) {
      this.search.slice(1).split('&').forEach((param) => {
        const [key, value] = param.split('=')

        if (key) {
          searchParams.append(
            decodeURIComponent(key),
            value ? decodeURIComponent(value) : '',
          )
        }
      })
    }

    return searchParams
  }

  get origin() {
    return `${this.protocol}://${this.hostname}${this.port ? `:${this.port}` : ''}`
  }

  get host() {
    return this.hostname + (this.port ? `:${this.port}` : '')
  }

  set host(value: string) {
    this.hostname = value.split(':')[0]
    this.port = value.split(':')[1] || ''
  }

  toString() {
    return this.href
  }

  toJSON() {
    return this.href
  }
}
