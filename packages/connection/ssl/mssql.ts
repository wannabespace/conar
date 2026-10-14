import type { IOptions } from 'mssql'

/** The option a one-click SSL fix sets; keys are read lowercase. */
export const sslSettings = {
  off: ['encrypt', 'false'],
  on: ['encrypt', 'true'],
  unverified: ['trustservercertificate', 'true'],
} as const

export const parseSSLConfig = (searchParams: URLSearchParams): IOptions => {
  const encrypt = searchParams.get('encrypt')
  const trustServerCertificate = searchParams.get('trustservercertificate')

  const options: IOptions = {
    encrypt: encrypt?.toLowerCase() !== 'false',
    trustServerCertificate: trustServerCertificate?.toLowerCase() !== 'false',
  }

  return options
}
