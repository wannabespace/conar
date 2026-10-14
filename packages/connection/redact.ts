import type { ConnectionParts } from './connection-parts'

const HEX_GROUP = '[\\da-f]{1,4}'
const ANY_IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/gu
/** Full or `::`-compressed, with an optional zone id (`fe80::1%en0`); brackets stay outside the match. */
const ANY_IPV6 = new RegExp(
  `(?<![\\w:])(?:(?:${HEX_GROUP}:){7}${HEX_GROUP}|(?:${HEX_GROUP}(?::${HEX_GROUP})*)?::(?:${HEX_GROUP}(?::${HEX_GROUP})*)?)(?:%[\\w.]+)?(?![\\w:])`,
  'giu'
)
/** The only options whose value may reach the AI: any other key's value can be a secret or a name, however harmless it looks (`sslpassword=123456`). */
const SETTING_KEYS = new Set([
  'connect_timeout',
  'connecttimeout',
  'encrypt',
  'pgbouncer',
  'ssl',
  'sslmaxversion',
  'sslminversion',
  'sslmode',
  'sslrejectunauthorized',
  'trustservercertificate',
])
const NON_IDENTIFYING_VALUE =
  /^(?:true|false|yes|no|on|off|\d+(?:\.\d+)?|disable|allow|prefer|require|verify|verify-ca|verify-full|no-verify|strict|optional|mandatory|disabled|preferred|required|verify_ca|verify_identity|tlsv1(?:\.[0-3])?)$/iu

/** Strips the values that identify the user's server, and any IP address (Postgres names the client's own), from an error. IPv4 goes first: an IPv4-mapped IPv6 address would otherwise keep its IPv4 tail. */
export const redactConnectionError = (
  message: string,
  parts: ConnectionParts
) => {
  const secrets: [string | undefined, string][] = [
    [parts.password, '<password>'],
    [parts.ssh?.host, '<ssh-host>'],
    [parts.host, '<host>'],
    [parts.user, '<user>'],
    [parts.ssh?.user, '<ssh-user>'],
    [parts.database, '<database>'],
  ]
  let redacted = message
  for (const [value, placeholder] of secrets
    .filter(
      (entry): entry is [string, string] => !!entry[0] && entry[0].length > 1
    )
    .toSorted(([a], [b]) => b.length - a.length)) {
    redacted = redacted.replaceAll(value, placeholder)
  }
  return redacted.replaceAll(ANY_IPV4, '<ip>').replaceAll(ANY_IPV6, '<ip>')
}

export const redactOptions = (options: string) =>
  new URLSearchParams(
    [...new URLSearchParams(options)].map(([key, value]) => [
      key,
      SETTING_KEYS.has(key.toLowerCase()) && NON_IDENTIFYING_VALUE.test(value)
        ? value
        : '<redacted>',
    ])
  ).toString()
