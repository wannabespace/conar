import { connectionParts } from './connection-parts'
import type { DiagnosisContext } from './diagnose'
import type { HostKind } from './hosts'
import { hostHintOf, hostKindOf } from './hosts'

const HOST_KIND_LABELS: Record<HostKind, string> = {
  'ipv6-only': 'direct host (IPv6-only)',
  local: 'localhost',
  private: 'private network',
  public: 'public host',
  service: 'single-label name (Docker service?)',
}

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

/** What an AI request about a failed connection may carry: no address, user, database or secret. */
export const diagnosisRequestOf = ({
  message,
  parts,
}: Pick<DiagnosisContext, 'message' | 'parts'>) => {
  const port = connectionParts.port(parts)
  const identifying: [string | undefined, string][] = [
    [parts.password, '<password>'],
    [parts.ssh?.host, '<ssh-host>'],
    [parts.host, '<host>'],
    [parts.user, '<user>'],
    [parts.ssh?.user, '<ssh-user>'],
    [parts.database, '<database>'],
  ]
  let error = message
  for (const [value, placeholder] of identifying
    .filter(
      (entry): entry is [string, string] => !!entry[0] && entry[0].length > 1
    )
    .toSorted(([a], [b]) => b.length - a.length)) {
    error = error.replaceAll(value, placeholder)
  }
  return {
    // IPv4 goes first: an IPv4-mapped IPv6 address would otherwise keep its IPv4 tail.
    error: error.replaceAll(ANY_IPV4, '<ip>').replaceAll(ANY_IPV6, '<ip>'),
    hostKind: [
      hostHintOf(parts.host)?.label,
      HOST_KIND_LABELS[hostKindOf(parts.host)],
    ]
      .filter(Boolean)
      .join(' '),
    options: new URLSearchParams(
      [...new URLSearchParams(parts.options)].map(([key, value]) => [
        key,
        SETTING_KEYS.has(key.toLowerCase()) && NON_IDENTIFYING_VALUE.test(value)
          ? value
          : '<redacted>',
      ])
    ).toString(),
    passwordSet: !!parts.password,
    port: /^\d{1,5}$/u.test(port) ? port : '',
    sshEnabled: !!parts.ssh,
    type: parts.type,
    userSet: !!parts.user,
  }
}
