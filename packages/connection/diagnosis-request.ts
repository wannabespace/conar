import { portOf } from './connection-parts'
import type { DiagnosisContext } from './diagnose'
import type { HostKind } from './hosts'
import { hostHintOf, hostKindOf } from './hosts'
import { redactConnectionError, redactOptions } from './redact'

const HOST_KIND_LABELS: Record<HostKind, string> = {
  'ipv6-only': 'direct host (IPv6-only)',
  local: 'localhost',
  private: 'private network',
  public: 'public host',
  service: 'single-label name (Docker service?)',
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
    hostKind: [
      hostHintOf(parts.host)?.label,
      HOST_KIND_LABELS[hostKindOf(parts.host)],
    ]
      .filter(Boolean)
      .join(' '),
    options: redactOptions(parts.options),
    passwordSet: !!parts.password,
    port: /^\d{1,5}$/u.test(port) ? port : '',
    runtime: desktop ? ('desktop' as const) : ('web' as const),
    sshEnabled: !!parts.ssh,
    type: parts.type,
    userSet: !!parts.user,
  }
}
