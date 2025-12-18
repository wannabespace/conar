import type { DatabaseType } from '@conar/shared/enums/database-type'
import type { editor } from 'monaco-editor'
import type { CompletionRegistration } from 'monacopilot'
import type { RefObject } from 'react'
import * as monaco from 'monaco-editor'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { registerCompletion } from 'monacopilot'
import { useEffect, useRef } from 'react'
import { databaseAICompletionContext } from '~/entities/database/utils/monaco'
import { orpc } from '~/lib/orpc'
import { Route } from '../..'

export const dialectsMap = {
  postgres: LanguageIdEnum.PG,
  mysql: LanguageIdEnum.MYSQL,
  mssql: LanguageIdEnum.PG,
  clickhouse: LanguageIdEnum.MYSQL,
} satisfies Record<DatabaseType, LanguageIdEnum>

export function useRunnerEditorAiTabCompletion(monacoRef:
RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()

  const completionRef = useRef<CompletionRegistration | null>(null)
  const completionCacheRef = useRef<{
    prefix: string
    completion: string
  } | null>(null)

  useEffect(() => {
    if (!monacoRef.current)
      return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let pendingResolve: ((value: { completion: string }) => void) | null = null

    let isMounted = true

    const setupCompletion = async () => {
      if (!isMounted)
        return

      const aiConfig = await databaseAICompletionContext(database)
      if (!isMounted)
        return

      const schemaContext = await aiConfig.buildSchemaContext()

      if (!isMounted)
        return

      if (completionRef.current) {
        completionRef.current.deregister()
      }

      if (!monacoRef.current)
        return

      completionRef.current = registerCompletion(
        monaco,
        monacoRef.current,
        {
          trigger: 'onTyping',
          language: dialectsMap[database.type],
          requestHandler: async () => {
            const model = monacoRef.current?.getModel()
            const position = monacoRef.current?.getPosition()

            if (model && position && completionCacheRef.current) {
              const offset = model.getOffsetAt(position)
              const textFull = model.getValue()
              const textBefore = textFull.substring(0, offset)
              const cached = completionCacheRef.current

              if (textBefore.startsWith(cached.prefix)) {
                const addedText = textBefore.slice(cached.prefix.length)

                if (cached.completion.startsWith(addedText)) {
                  const remainingCompletion = cached.completion.slice(addedText.length)

                  if (remainingCompletion.length > 0) {
                    return { completion: remainingCompletion }
                  }

                  return { completion: '' }
                }
              }
            }

            if (debounceTimer) {
              clearTimeout(debounceTimer)
            }
            if (pendingResolve) {
              pendingResolve({ completion: '' })
              pendingResolve = null
            }

            return new Promise((resolve) => {
              pendingResolve = resolve
              debounceTimer = setTimeout(async () => {
                if (!isMounted)
                  return

                try {
                  const model = monacoRef.current?.getModel()
                  const position = monacoRef.current?.getPosition()

                  if (!model || !position) {
                    resolve({ completion: '' })
                    return
                  }

                  const fileContent = model.getValue()
                  const offset = model.getOffsetAt(position)
                  const context = fileContent.substring(0, offset)
                  const suffix = fileContent.substring(offset)

                  if (context.trim().length < 2) {
                    resolve({ completion: '' })
                    return
                  }

                  const transformedBody = {
                    context,
                    suffix,
                    instruction: 'Complete the SQL query with secure and safe optimised version',
                    fileContent,
                    databaseType: aiConfig.databaseType,
                    schemaContext,
                  }

                  const result = await orpc.ai.codeCompletion(transformedBody)

                  if (pendingResolve === resolve) {
                    completionCacheRef.current = {
                      prefix: context,
                      completion: result.completion,
                    }

                    resolve(result)
                  }
                  else {
                    resolve({ completion: '' })
                  }
                }
                catch (error) {
                  console.error(error)
                  resolve({ completion: '' })
                }
                finally {
                  if (pendingResolve === resolve)
                    pendingResolve = null
                }
              }, 500)
            })
          },
        },
      )
    }

    setupCompletion()

    return () => {
      isMounted = false
      if (debounceTimer)
        clearTimeout(debounceTimer)
      if (pendingResolve)
        pendingResolve({ completion: '' })
      if (completionRef.current) {
        completionRef.current.deregister()
        completionRef.current = null
      }
    }
  }, [database])
}
