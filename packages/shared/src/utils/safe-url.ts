// eslint-disable-next-line regexp/no-super-linear-backtracking
const urlRegex = /^([a-z][a-z\d+\-.]*):\/\/(?:([^:@/\s]*)(?::([^@/\s]*))?@)?([^:/\s]+|\[[^\]]+\])(?::(\d+))?(?:\/([^?#\s]*))?(?:\?([^#\s]*))?(?:#(.*))?$/i

export class SafeURL implements URL {
  #url!: URL
  username!: string
  password!: string

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

    const _url = new URL(`${protocol}://${hostname}`)

    if (hash) {
      _url.hash = hash
    }

    if (search) {
      _url.search = search
    }

    if (pathname) {
      _url.pathname = pathname ? `/${pathname}` : '/'
    }

    if (port) {
      _url.port = port || ''
    }

    this.username = typeof username === 'string' ? username : ''
    this.password = typeof password === 'string' ? password : ''
    this.#url = _url
  }

  get protocol() {
    return this.#url.protocol
  }

  set protocol(value: string) {
    this.#url.protocol = value
  }

  get origin() {
    return `${this.protocol}//${this.host}`
  }

  get host() {
    return this.#url.host
  }

  set host(value: string) {
    this.#url.host = value
  }

  get hostname() {
    return this.#url.hostname
  }

  set hostname(value: string) {
    this.#url.hostname = value
  }

  get port() {
    return this.#url.port
  }

  set port(value: string) {
    this.#url.port = value
  }

  get pathname() {
    return this.#url.pathname
  }

  set pathname(value: string) {
    this.#url.pathname = value
  }

  get search() {
    return this.#url.search
  }

  set search(value: string) {
    this.#url.search = value
  }

  get hash() {
    return this.#url.hash
  }

  set hash(value: string) {
    this.#url.hash = value
  }

  get searchParams() {
    return this.#url.searchParams
  }

  get href() {
    const url = new URL(this.#url.toString())
    const originalUsername = this.username
    const originalPassword = this.password

    const encodedUsername = encodeURIComponent(originalUsername)
    const encodedPassword = encodeURIComponent(originalPassword)

    url.username = encodedUsername || ''
    url.password = encodedPassword || ''

    let href = url.toString()

    if (originalUsername !== encodedUsername) {
      href = href.replace(encodedUsername, originalUsername)
    }

    if (originalPassword !== encodedPassword) {
      href = href.replace(encodedPassword, originalPassword)
    }

    return href
  }

  get hrefEncoded() {
    const url = new URL(this.#url.toString())

    url.username = this.username || ''
    url.password = this.password || ''

    return url.toString()
  }

  toString() {
    return this.href
  }

  toJSON() {
    return this.href
  }
}
