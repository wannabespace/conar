import type { IOptions } from 'mssql'

export function parseSSLConfig(searchParams: URLSearchParams): IOptions {
  const encrypt = searchParams.get('encrypt')
  const trustServerCertificate = searchParams.get('trustservercertificate')

  const options: IOptions = {
    encrypt: encrypt !== 'false',
    trustServerCertificate: trustServerCertificate !== 'false',
  }

  return options
}
