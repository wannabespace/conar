import { Buffer } from 'node:buffer'

export function encodeBase64(value: string) {
  return Buffer.from(value).toString('base64')
}

export function decodeBase64(value: string) {
  return Buffer.from(value, 'base64').toString('utf8')
}
