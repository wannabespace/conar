import type { Connection } from './types'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { executeRedisCommand } from '~/entities/connection/redis'
import { KEY_FETCHERS, REDIS_COMMANDS } from './constants'

export function useRedisCommand(connection: Connection) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ command, args = [] }: { command: string, args?: string[] }) =>
      executeRedisCommand({ connectionString: connection.connectionString, command, args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['redis', connection.id] }),
  })
}

async function fetchRedisKeys(connectionString: string, pattern: string) {
  const keys: string[] = []
  let cursor = 0
  do {
    const { result } = await executeRedisCommand({
      connectionString,
      command: 'SCAN',
      args: [String(cursor), 'MATCH', pattern || '*', 'COUNT', '100'],
    })
    const [nextCursor, keyList] = Array.isArray(result) ? result : [0, []]
    cursor = Number(nextCursor ?? 0)
    keys.push(...(Array.isArray(keyList) ? keyList : []).map(String))
  } while (cursor !== 0)
  return keys
}

export function redisKeysQueryOptions(connection: Connection, pattern: string) {
  return queryOptions({
    queryKey: ['redis', connection.id, 'keys', pattern] as const,
    queryFn: () => fetchRedisKeys(connection.connectionString, pattern),
    enabled: !!connection.connectionString,
  })
}

export function useRedisKeys(connection: Connection, pattern: string) {
  return useQuery(redisKeysQueryOptions(connection, pattern))
}

export function useRedisInfo(connection: Connection) {
  return useQuery({
    queryKey: ['redis', connection.id, 'info'],
    queryFn: async () => {
      const [{ result: dbSizeResult }, { result: memoryResult }] = await Promise.all([
        executeRedisCommand({ connectionString: connection.connectionString, command: 'DBSIZE' }),
        executeRedisCommand({ connectionString: connection.connectionString, command: 'INFO', args: ['memory'] }),
      ])
      const memoryString = typeof memoryResult === 'string' ? memoryResult : String(memoryResult)
      return {
        dbsize: typeof dbSizeResult === 'number' ? dbSizeResult : Number(dbSizeResult) ?? 0,
        usedMemory: memoryString.match(/used_memory_human:(\S+)/)?.[1] ?? '-',
      }
    },
    enabled: !!connection.connectionString,
  })
}

export function useRedisKeyDetails(connection: Connection, key: string | null) {
  return useQuery({
    queryKey: ['redis', connection.id, 'key', key],
    queryFn: async () => {
      if (!key)
        return null
      const [{ result: typeResult }, { result: ttlResult }] = await Promise.all([
        executeRedisCommand({ connectionString: connection.connectionString, command: 'TYPE', args: [key] }),
        executeRedisCommand({ connectionString: connection.connectionString, command: 'TTL', args: [key] }),
      ])
      const type = String(typeResult ?? '')
      try {
        const [commandName, extraArgs] = KEY_FETCHERS[type] ?? ['GET', []]
        const { result: value } = await executeRedisCommand({
          connectionString: connection.connectionString,
          command: commandName,
          args: [key, ...extraArgs],
        })
        return { type, ttl: Number(ttlResult ?? -1), value }
      }
      catch {
        return { type, ttl: Number(ttlResult ?? -1), value: null }
      }
    },
    enabled: !!connection.connectionString && !!key,
  })
}

export function useCommandSuggestions(command: string, keys: string[]) {
  const parts = command.trimStart().split(/\s+/)
  const lastWord = parts[parts.length - 1] ?? ''
  const isCommandMode = parts.length === 1
  const needsKey = parts.length > 1

  const commandSuggestions = useMemo(() => {
    if (!isCommandMode)
      return []
    return REDIS_COMMANDS.filter(c => c.startsWith(lastWord.toUpperCase())).slice(0, 10)
  }, [isCommandMode, lastWord])

  const keySuggestions = useMemo(() => {
    if (!needsKey || !lastWord)
      return []
    const lowerWord = lastWord.toLowerCase()
    return keys.filter(k => k.toLowerCase().includes(lowerWord)).slice(0, 10)
  }, [needsKey, lastWord, keys])

  const suggestions = needsKey && keys.length > 0 ? keySuggestions : commandSuggestions

  return { suggestions, lastWord, isCommandMode, needsKey, parts }
}
