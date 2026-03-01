import { Button } from '@conar/ui/components/button'
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@conar/ui/components/resizable'
import { RiPlayFill } from '@remixicon/react'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { executeRedisCommand } from '~/entities/connection/redis'
import { Route } from '../..'
import { formatValueForToast, WRITE_KEY_COMMANDS } from './lib/constants'
import { useRedisCommand, useRedisInfo, useRedisKeyDetails, useRedisKeys } from './lib/hooks'
import { getCommandMessage, parseCommand } from './lib/utils'
import { RedisCommandInput } from './redis-command-input'
import { RedisHeader } from './redis-header'
import { RedisKeyDetails } from './redis-key-details'
import { RedisKeyList } from './redis-key-list'

export function RedisRunner() {
  const { connection } = Route.useLoaderData()
  const [command, setCommand] = useState('')
  const [pattern, setPattern] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: keys = [], isLoading: keysLoading, isFetching: keysFetching, refetch: refetchKeys, dataUpdatedAt: keysUpdatedAt } = useRedisKeys(connection, pattern)
  const { data: info, isLoading: infoLoading } = useRedisInfo(connection)
  const { data: keyDetails, isLoading: keyDetailsLoading } = useRedisKeyDetails(connection, selectedKey)
  const runCommand = useRedisCommand(connection)

  const run = useCallback(() => {
    const parsed = parseCommand(command)
    if (!parsed)
      return
    const { cmd, args } = parsed
    runCommand.mutate(
      { command: cmd, args },
      {
        onSuccess: async (data) => {
          setCommand('')
          queryClient.invalidateQueries({ queryKey: ['redis', connection.id] })

          const key = args[0]

          if (cmd === 'EXISTS' && Boolean(data.result) && key) {
            try {
              const { result } = await executeRedisCommand({
                connectionString: connection.connectionString,
                command: 'GET',
                args: [key],
              })
              toast.success(`${key}: exists`, {
                description: `Value: ${formatValueForToast(result)}`,
              })
            }
            catch {
              toast.success(`${key}: exists`)
            }
          }
          else if (WRITE_KEY_COMMANDS.has(cmd) && key) {
            setSelectedKey(key)
            toast.success(getCommandMessage(cmd, data.result, args))
          }
          else if (cmd === 'DEL') {
            if (selectedKey && args.includes(selectedKey))
              setSelectedKey(null)
            toast.success(getCommandMessage(cmd, data.result, args))
          }
          else {
            toast.success(getCommandMessage(cmd, data.result, args))
          }
        },
        onError: error => toast.error(error instanceof Error ? error.message : 'Command failed'),
      },
    )
  }, [command, runCommand, connection.id, connection.connectionString, queryClient, selectedKey])

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize="25%" minSize="15%" maxSize="40%">
        <RedisKeyList
          keys={keys}
          keysLoading={keysLoading}
          keysFetching={keysFetching}
          keysUpdatedAt={keysUpdatedAt}
          pattern={pattern}
          setPattern={setPattern}
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
          refetchKeys={refetchKeys}
        />
      </ResizablePanel>
      <ResizableSeparator withHandle />
      <ResizablePanel defaultSize="75%">
        <div className="flex h-full flex-col">
          <RedisHeader connection={connection} info={info} infoLoading={infoLoading} />
          <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
            <div className="flex items-end gap-2">
              <RedisCommandInput
                command={command}
                setCommand={setCommand}
                onRun={run}
                keys={keys}
                keysLoading={keysLoading}
              />
              <Button
                size="sm"
                type="button"
                className="h-full"
                onClick={run}
                disabled={!command.trim() || runCommand.isPending}
              >
                <RiPlayFill />
                Run
              </Button>
            </div>
            {selectedKey && (
              <RedisKeyDetails
                selectedKey={selectedKey}
                keyDetails={keyDetails}
                keyDetailsLoading={keyDetailsLoading}
              />
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
