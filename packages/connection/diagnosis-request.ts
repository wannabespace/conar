import { portOf } from './connection-parts'
import type { DiagnosisContext } from './diagnose'
import {
  hostHintOf,
  isIpv6OnlyHost,
  isLocalHost,
  isPrivateHost,
  isServiceName,
} from './hosts'
import { redactConnectionError, redactOptions } from './redact'

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
  const port = portOf(parts)
  return {
    error: redactConnectionError(message, parts),
    hostKind: hostKindOf(parts.host),
    options: redactOptions(parts.options),
    passwordSet: !!parts.password,
    port: /^\d{1,5}$/u.test(port) ? port : '',
    runtime: desktop ? ('desktop' as const) : ('web' as const),
    sshEnabled: !!parts.ssh,
    type: parts.type,
    userSet: !!parts.user,
  }
}
