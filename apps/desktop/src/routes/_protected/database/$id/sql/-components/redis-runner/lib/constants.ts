export const WRITE_KEY_COMMANDS = new Set([
  'SET',
  'HSET',
  'LPUSH',
  'RPUSH',
  'SADD',
  'ZADD',
])

export const REDIS_COMMANDS = [
  'GET',
  'SET',
  'DEL',
  'EXISTS',
  'EXPIRE',
  'TTL',
  'TYPE',
  'KEYS',
  'SCAN',
  'INCR',
  'DECR',
  'INCRBY',
  'DECRBY',
  'APPEND',
  'STRLEN',
  'GETRANGE',
  'SETRANGE',
  'HSET',
  'HGET',
  'HGETALL',
  'HDEL',
  'HKEYS',
  'HVALS',
  'HLEN',
  'LPUSH',
  'RPUSH',
  'LPOP',
  'RPOP',
  'LRANGE',
  'LLEN',
  'LINDEX',
  'SADD',
  'SREM',
  'SMEMBERS',
  'SISMEMBER',
  'SCARD',
  'ZADD',
  'ZREM',
  'ZRANGE',
  'ZRANGEBYSCORE',
  'ZCARD',
  'ZSCORE',
  'PING',
  'DBSIZE',
  'INFO',
  'FLUSHDB',
  'FLUSHALL',
] as const

export function formatValueForToast(value: unknown, maxLen = 80): string {
  if (value == null)
    return '(empty)'
  const str = typeof value === 'string' ? value : JSON.stringify(value)
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str
}

export const COMMAND_MESSAGES: Record<string, (result: unknown, args: string[]) => string> = {
  PING: () => 'Connection is alive',
  GET: (r, args) => {
    const key = args[0] ?? 'key'
    if (r == null)
      return `${key}: does not exist or is empty`
    return `${key}: ${formatValueForToast(r)}`
  },
  SET: (_, args) => {
    const key = args[0] ?? 'key'
    return `Created ${key}`
  },
  HSET: (_, args) => {
    const key = args[0] ?? 'key'
    return `Updated hash ${key}`
  },
  LPUSH: (_, args) => {
    const key = args[0] ?? 'key'
    return `Pushed to list ${key}`
  },
  RPUSH: (_, args) => {
    const key = args[0] ?? 'key'
    return `Pushed to list ${key}`
  },
  SADD: (_, args) => {
    const key = args[0] ?? 'key'
    return `Added to set ${key}`
  },
  ZADD: (_, args) => {
    const key = args[0] ?? 'key'
    return `Added to sorted set ${key}`
  },
  DEL: (r, args) => {
    const count = typeof r === 'number' ? r : 1
    const keys = args.slice(0, count).join(', ')
    return count === 1 ? `Deleted ${keys}` : `Deleted ${count} keys: ${keys || '(see list)'}`
  },
  EXPIRE: () => 'TTL set',
  PEXPIRE: () => 'TTL set',
  INCR: r => `Now ${r}`,
  INCRBY: r => `Now ${r}`,
  DECR: r => `Now ${r}`,
  DECRBY: r => `Now ${r}`,
  EXISTS: (r, args) => {
    const key = args[0] ?? 'key'
    const exists = r === 1 || r === true
    return exists ? `${key}: exists` : `${key}: does not exist`
  },
  FLUSHDB: () => 'Database cleared',
  FLUSHALL: () => 'All databases cleared',
}

export const KEY_FETCHERS: Record<string, [string, string[]]> = {
  string: ['GET', []],
  hash: ['HGETALL', []],
  list: ['LRANGE', ['0', '-1']],
  set: ['SMEMBERS', []],
  zset: ['ZRANGE', ['0', '-1', 'WITHSCORES']],
}

export const TEXTAREA_CLS = 'selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground dark:bg-input/30 flex min-h-9 w-full min-w-0 max-h-[200px] resize-none rounded-md border bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 overflow-y-auto font-mono md:text-sm [field-sizing:content]'
