import { hostHintOf, IPV4, isLocalHost } from '../hosts'

const GENERIC_LABELS = new Set(['db', 'www'])

const hostLabelOf = (host: string) => {
  if (isLocalHost(host)) {
    return 'Local'
  }
  if (IPV4.test(host)) {
    return host
  }
  return (
    hostHintOf(host)?.label ??
    host.split('.').find((label) => !GENERIC_LABELS.has(label.toLowerCase())) ??
    host
  )
}

export const suggestConnectionName = ({
  database,
  host,
}: {
  database: string
  host: string
}): string | null => {
  if (!host) {
    return null
  }
  const hostLabel = hostLabelOf(host)
  return database ? `${hostLabel} · ${database}` : hostLabel
}
