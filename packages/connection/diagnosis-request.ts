import { DEFAULT_PORTS } from './connection-parts'
import type { DiagnosisContext } from './diagnose'
import {
  hostHintOf,
  isIpv6OnlyHost,
  isLocalHost,
  isPrivateHost,
  isServiceName,
} from './hosts'
import { redactConnectionError, redactOptions } from './redact'

/** Sync with `error: 'string <= 4000'` and `options: 'string <= 2000'` in packages/ai/features/diagnose-connection.ts: a longer value fails the request. */
const MAX_ERROR_LENGTH = 4000
const MAX_OPTIONS_LENGTH = 2000
const PORT = /^\d{1,5}$/u

const hostKindOf = (host: string) => {
  if (isLocalHost(host)) {
    return 'localhost'
  }
  if (isServiceName(host)) {
    return 'single-label name (Docker service?)'
  }
  if (isPrivateHost(host)) {
    return 'private network'
  }
  const provider = hostHintOf(host)?.label
  return provider
    ? `${provider}${isIpv6OnlyHost(host) ? ' direct host (IPv6-only)' : ''}`
    : 'public host'
}

/** What an AI request about a failed connection may carry: no address, user, database or secret. */
export const diagnosisRequestOf = ({
  desktop,
  message,
  parts,
}: DiagnosisContext) => {
  const port =
    parts.port || (parts.type ? String(DEFAULT_PORTS[parts.type]) : '')
  return {
    error: redactConnectionError(message, parts).slice(0, MAX_ERROR_LENGTH),
    hostKind: hostKindOf(parts.host),
    options: redactOptions(parts.options).slice(0, MAX_OPTIONS_LENGTH),
    passwordSet: !!parts.password,
    port: PORT.test(port) ? port : '',
    runtime: desktop ? ('desktop' as const) : ('web' as const),
    sshEnabled: !!parts.ssh,
    userSet: !!parts.user,
  }
}
