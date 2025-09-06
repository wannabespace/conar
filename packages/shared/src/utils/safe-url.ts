const authRegex = /^([^:]+):\/\/([^:]*)(?::(.*))?$/

export class SafeURL implements URL {
  #url!: URL
  username!: string
  password!: string

  constructor(url: string) {
    let _url = url
    const atIndex = url.lastIndexOf('@')

    let username = ''
    let password = ''

    if (atIndex > 0) {
      const beforeAt = url.substring(0, atIndex)
      const afterAt = url.substring(atIndex + 1)
      const authMatch = beforeAt.match(authRegex)

      if (authMatch) {
        const [, protocol, _user, _password] = authMatch
        _url = `${protocol}://${afterAt}`
        username = _user || ''
        password = _password || ''
      }
    }

    const _URL = new URL(_url)

    this.#url = _URL
    this.username = username || ''
    this.password = password || ''
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
    const url = new URL(this.#url)
    const originalUsername = this.username
    const originalPassword = this.password

    const encodedUsername = encodeURIComponent(originalUsername)
    const encodedPassword = encodeURIComponent(originalPassword)

    url.username = encodedUsername || ''
    url.password = encodedPassword || ''

    let href = url.toString()

    if (originalUsername !== encodedUsername) {
      href = href.replace(encodedUsername, originalUsername.replaceAll(' ', '%20'))
    }

    if (originalPassword !== encodedPassword) {
      href = href.replace(encodedPassword, originalPassword.replaceAll(' ', '%20'))
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
