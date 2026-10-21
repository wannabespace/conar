/**
 * Only X-Real-IP is set by Railway's edge; any other client-IP header can be spoofed.
 * An IPv6 client is its /64, since one user holds the whole network.
 */
export const clientNetwork = (headers: Headers) => {
  const ip = headers.get('x-real-ip') ?? 'unknown'
  if (!ip.includes(':') || ip.includes('.')) {
    return ip.slice(ip.lastIndexOf(':') + 1)
  }
  const [head = '', tail = ''] = ip.split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const zeros = Array.from(
    { length: 8 - left.length - right.length },
    () => '0'
  )
  return [...left, ...zeros, ...right].slice(0, 4).join(':')
}
