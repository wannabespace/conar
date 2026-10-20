/** An Oracle listener speaks TLS only on its own TCPS port, so the string turns it on (`ssl=true`) and nothing falls back. */
export const parseSSLConfig = (searchParams: URLSearchParams) =>
  searchParams.get('ssl')?.toLowerCase() === 'true'
