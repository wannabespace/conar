import type { IOptions } from 'mssql'

export const parseSSLConfig = (searchParams: URLSearchParams): IOptions => {
  const encrypt = searchParams.get('encrypt')
  const trustServerCertificate = searchParams.get('trustservercertificate')

  const options: IOptions = {
    encrypt: encrypt?.toLowerCase() !== 'false',
    trustServerCertificate: trustServerCertificate?.toLowerCase() !== 'false',
  }

  return options
}
